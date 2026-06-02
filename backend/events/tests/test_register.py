"""Task 4: Registration (free path), capacity, waitlist, cancel/promote, seats signal."""

from datetime import timedelta

import pytest
from django.utils import timezone
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from events.models import EventStatus, RegStatus
from events.tests.factories import EventFactory, RegistrationFactory

REGISTER_URL = "/api/v1/events/{slug}/register"
CANCEL_URL = "/api/v1/events/{slug}/cancel"
REGISTRATIONS_URL = "/api/v1/events/registrations"


def _auth(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _future_event(**kwargs):
    return EventFactory(
        starts_at=timezone.now() + timedelta(days=7),
        status=EventStatus.PUBLISHED,
        **kwargs,
    )


# ---------------------------------------------------------------------------
# Register — auth guard
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_register_requires_auth():
    e = _future_event()
    res = APIClient().post(REGISTER_URL.format(slug=e.slug))
    assert res.status_code == 401


# ---------------------------------------------------------------------------
# Register — free event under capacity
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_register_free_under_capacity_confirmed():
    e = _future_event(capacity=5, price_pln=0)
    u = UserFactory()
    res = _auth(u).post(REGISTER_URL.format(slug=e.slug))
    assert res.status_code == 201
    assert res.json()["status"] == RegStatus.CONFIRMED


@pytest.mark.django_db
def test_register_free_no_capacity_limit_confirmed():
    e = _future_event(capacity=None, price_pln=0)
    u = UserFactory()
    res = _auth(u).post(REGISTER_URL.format(slug=e.slug))
    assert res.status_code == 201
    assert res.json()["status"] == RegStatus.CONFIRMED


@pytest.mark.django_db
def test_register_free_increments_seats_taken():
    e = _future_event(capacity=10, price_pln=0)
    u = UserFactory()
    _auth(u).post(REGISTER_URL.format(slug=e.slug))
    e.refresh_from_db()
    assert e.seats_taken == 1


# ---------------------------------------------------------------------------
# Register — waitlist when full
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_register_at_capacity_waitlisted():
    e = _future_event(capacity=1, price_pln=0)
    # Fill the one seat
    RegistrationFactory(event=e, status=RegStatus.CONFIRMED)
    u = UserFactory()
    res = _auth(u).post(REGISTER_URL.format(slug=e.slug))
    assert res.status_code == 201
    assert res.json()["status"] == RegStatus.WAITLISTED


@pytest.mark.django_db
def test_waitlisted_does_not_increment_seats_taken():
    e = _future_event(capacity=1, price_pln=0)
    RegistrationFactory(event=e, status=RegStatus.CONFIRMED)
    u = UserFactory()
    _auth(u).post(REGISTER_URL.format(slug=e.slug))
    e.refresh_from_db()
    # seats_taken should still be 1 (the original confirmed), not 2
    assert e.seats_taken == 1


# ---------------------------------------------------------------------------
# Register — duplicate active registration → 400
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_register_duplicate_returns_400():
    e = _future_event(price_pln=0)
    u = UserFactory()
    _auth(u).post(REGISTER_URL.format(slug=e.slug))
    res = _auth(u).post(REGISTER_URL.format(slug=e.slug))
    assert res.status_code == 400
    data = res.json()
    # error code "already_registered"
    assert "already_registered" in str(data)


# ---------------------------------------------------------------------------
# Register — closed / past event → 400
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_register_past_event_returns_400():
    e = EventFactory(starts_at=timezone.now() - timedelta(days=1), status=EventStatus.PUBLISHED)
    u = UserFactory()
    res = _auth(u).post(REGISTER_URL.format(slug=e.slug))
    assert res.status_code == 400
    assert "event_not_open" in str(res.json())


@pytest.mark.django_db
def test_register_draft_event_returns_404():
    e = EventFactory(starts_at=timezone.now() + timedelta(days=7), status=EventStatus.DRAFT)
    u = UserFactory()
    res = _auth(u).post(REGISTER_URL.format(slug=e.slug))
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# Cancel — CONFIRMED → CANCELED + seat freed + promote oldest waitlisted
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_cancel_confirmed_becomes_canceled():
    from events.models import Registration

    e = _future_event(capacity=5, price_pln=0)
    u = UserFactory()
    _auth(u).post(REGISTER_URL.format(slug=e.slug))
    reg = Registration.objects.get(event=e, user=u)
    assert reg.status == RegStatus.CONFIRMED
    res = _auth(u).post(CANCEL_URL.format(slug=e.slug))
    assert res.status_code == 200
    reg.refresh_from_db()
    assert reg.status == RegStatus.CANCELED


@pytest.mark.django_db
def test_cancel_confirmed_frees_seat():
    e = _future_event(capacity=5, price_pln=0)
    u = UserFactory()
    _auth(u).post(REGISTER_URL.format(slug=e.slug))
    e.refresh_from_db()
    assert e.seats_taken == 1
    _auth(u).post(CANCEL_URL.format(slug=e.slug))
    e.refresh_from_db()
    assert e.seats_taken == 0


@pytest.mark.django_db
def test_cancel_promotes_oldest_waitlisted():
    e = _future_event(capacity=1, price_pln=0)
    owner = UserFactory()
    # Fill seat
    reg_owner = RegistrationFactory(event=e, user=owner, status=RegStatus.CONFIRMED)
    # Two waitlisted users — w1 created first
    w1 = UserFactory()
    w2 = UserFactory()
    reg_w1 = RegistrationFactory(event=e, user=w1, status=RegStatus.WAITLISTED)
    reg_w2 = RegistrationFactory(event=e, user=w2, status=RegStatus.WAITLISTED)

    _auth(owner).post(CANCEL_URL.format(slug=e.slug))

    reg_owner.refresh_from_db()
    reg_w1.refresh_from_db()
    reg_w2.refresh_from_db()
    assert reg_owner.status == RegStatus.CANCELED
    assert reg_w1.status == RegStatus.CONFIRMED  # oldest promoted
    assert reg_w2.status == RegStatus.WAITLISTED  # second stays


@pytest.mark.django_db
def test_cancel_promotes_updates_seats_taken():
    e = _future_event(capacity=1, price_pln=0)
    owner = UserFactory()
    RegistrationFactory(event=e, user=owner, status=RegStatus.CONFIRMED)
    w1 = UserFactory()
    RegistrationFactory(event=e, user=w1, status=RegStatus.WAITLISTED)

    # Manually sync seats_taken to match 1 confirmed
    from events.models import Event as EventModel

    EventModel.all_objects.filter(pk=e.pk).update(seats_taken=1)

    _auth(owner).post(CANCEL_URL.format(slug=e.slug))

    e.refresh_from_db()
    # After cancel+promote: 1 confirmed (w1), so seats_taken == 1
    assert e.seats_taken == 1


# ---------------------------------------------------------------------------
# Cancel — WAITLISTED → CANCELED (no promote triggered)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_cancel_waitlisted_becomes_canceled():
    e = _future_event(capacity=1, price_pln=0)
    RegistrationFactory(event=e, status=RegStatus.CONFIRMED)  # seat taken
    w = UserFactory()
    reg = RegistrationFactory(event=e, user=w, status=RegStatus.WAITLISTED)
    res = _auth(w).post(CANCEL_URL.format(slug=e.slug))
    assert res.status_code == 200
    reg.refresh_from_db()
    assert reg.status == RegStatus.CANCELED


# ---------------------------------------------------------------------------
# Cancel — no active registration → 200 with null body (idempotent)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_cancel_no_registration_returns_200():
    e = _future_event()
    u = UserFactory()
    res = _auth(u).post(CANCEL_URL.format(slug=e.slug))
    assert res.status_code == 200


# ---------------------------------------------------------------------------
# GET /events/registrations — own non-canceled list
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_registrations_list_requires_auth():
    res = APIClient().get(REGISTRATIONS_URL)
    assert res.status_code == 401


@pytest.mark.django_db
def test_registrations_list_returns_own_only():
    u1 = UserFactory()
    u2 = UserFactory()
    e = _future_event()
    RegistrationFactory(event=e, user=u1, status=RegStatus.CONFIRMED)
    RegistrationFactory(event=e, user=u2, status=RegStatus.CONFIRMED)
    res = _auth(u1).get(REGISTRATIONS_URL)
    assert res.status_code == 200
    results = res.json().get("results", res.json())
    assert len(results) == 1


@pytest.mark.django_db
def test_registrations_list_excludes_canceled():
    u = UserFactory()
    e1 = _future_event()
    e2 = EventFactory(starts_at=timezone.now() + timedelta(days=3), status=EventStatus.PUBLISHED)
    RegistrationFactory(event=e1, user=u, status=RegStatus.CONFIRMED)
    RegistrationFactory(event=e2, user=u, status=RegStatus.CANCELED)
    res = _auth(u).get(REGISTRATIONS_URL)
    results = res.json().get("results", res.json())
    assert len(results) == 1


@pytest.mark.django_db
def test_registrations_list_fields():
    u = UserFactory()
    e = _future_event()
    RegistrationFactory(event=e, user=u, status=RegStatus.CONFIRMED)
    res = _auth(u).get(REGISTRATIONS_URL)
    item = res.json().get("results", res.json())[0]
    assert "status" in item
    assert "created_at" in item
    assert "event" in item
    event_data = item["event"]
    for f in ["slug", "title", "starts_at", "mode"]:
        assert f in event_data, f"Missing event field: {f}"


# ---------------------------------------------------------------------------
# seats_taken signal
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_seats_taken_recomputed_on_registration_save():
    e = _future_event(capacity=10)
    RegistrationFactory(event=e, status=RegStatus.CONFIRMED)
    RegistrationFactory(event=e, status=RegStatus.CONFIRMED)
    RegistrationFactory(event=e, status=RegStatus.WAITLISTED)
    e.refresh_from_db()
    # Signal fires on each save; final count = 2 CONFIRMED
    assert e.seats_taken == 2


@pytest.mark.django_db
def test_seats_taken_decrements_on_delete():
    e = _future_event(capacity=10)
    reg = RegistrationFactory(event=e, status=RegStatus.CONFIRMED)
    e.refresh_from_db()
    assert e.seats_taken == 1
    reg.delete()
    e.refresh_from_db()
    assert e.seats_taken == 0

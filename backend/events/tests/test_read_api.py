from datetime import timedelta

import pytest
from django.utils import timezone
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from events.models import EventMode, EventStatus, RecordingAccess
from events.tests.factories import EventFactory
from membership.models import PatronageStatus, PlanCode, SubStatus
from membership.tests.factories import (
    PatronageFactory,
    PatronTierFactory,
    PlanFactory,
    SubscriptionFactory,
)


def _auth(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


def _klan_user():
    u = UserFactory()
    SubscriptionFactory(
        user=u,
        plan=PlanFactory(code=PlanCode.KLAN),
        status=SubStatus.ACTIVE,
        period_end=timezone.now() + timedelta(days=30),
    )
    return u


def _klub_user():
    u = UserFactory()
    SubscriptionFactory(
        user=u,
        plan=PlanFactory(code=PlanCode.SOLO),
        status=SubStatus.ACTIVE,
        period_end=timezone.now() + timedelta(days=30),
    )
    return u


LIST_URL = "/api/v1/events"


# ---------------------------------------------------------------------------
# List — basic
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_list_returns_200():
    res = APIClient().get(LIST_URL)
    assert res.status_code == 200


@pytest.mark.django_db
def test_list_only_published():
    EventFactory(status=EventStatus.PUBLISHED)
    EventFactory(status=EventStatus.DRAFT)
    EventFactory(status=EventStatus.CANCELED)
    res = APIClient().get(LIST_URL)
    data = res.json()
    # cursor pagination wraps in {results: [...]}
    results = data.get("results", data)
    assert len(results) == 1


@pytest.mark.django_db
def test_list_mode_filter():
    EventFactory(mode=EventMode.ONLINE)
    EventFactory(mode=EventMode.LIVE)
    EventFactory(mode=EventMode.KLAN)
    res = APIClient().get(LIST_URL + "?mode=live")
    results = res.json().get("results", res.json())
    assert len(results) == 1
    assert results[0]["mode"] == "live"


@pytest.mark.django_db
def test_list_invalid_mode_returns_400():
    res = APIClient().get(LIST_URL + "?mode=bogus")
    assert res.status_code == 400


@pytest.mark.django_db
def test_list_when_upcoming():
    EventFactory(starts_at=timezone.now() + timedelta(days=7))
    EventFactory(starts_at=timezone.now() - timedelta(days=7))
    res = APIClient().get(LIST_URL + "?when=upcoming")
    results = res.json().get("results", res.json())
    assert len(results) == 1


@pytest.mark.django_db
def test_list_when_past():
    EventFactory(starts_at=timezone.now() + timedelta(days=7))
    EventFactory(starts_at=timezone.now() - timedelta(days=7))
    res = APIClient().get(LIST_URL + "?when=past")
    results = res.json().get("results", res.json())
    assert len(results) == 1


@pytest.mark.django_db
def test_list_invalid_when_returns_400():
    res = APIClient().get(LIST_URL + "?when=yesterday")
    assert res.status_code == 400


@pytest.mark.django_db
def test_list_fields_present():
    EventFactory(slug="test-event-fields")
    res = APIClient().get(LIST_URL)
    item = res.json().get("results", res.json())[0]
    for field in [
        "slug",
        "title",
        "mode",
        "starts_at",
        "duration_minutes",
        "host_name",
        "cover_image",
        "capacity",
        "seats_taken",
        "seats_remaining",
        "price_pln",
        "is_free",
        "is_featured",
        "status",
    ]:
        assert field in item, f"Missing field: {field}"


# ---------------------------------------------------------------------------
# List — N+1 guard
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_list_no_n_plus_one(django_assert_num_queries):
    """Verify the list endpoint is N+1-free: 5 events → at most 2 DB queries.

    Cursor pagination issues: 1 query for data (JOIN with host via select_related),
    1 query for cursor boundary — total is constant regardless of event count.
    """
    EventFactory.create_batch(5)
    with django_assert_num_queries(2):
        # select_related("host") collapses events + host into a single JOIN query.
        # Cursor pagination adds 1 extra query for boundary detection (still O(1), not O(N)).
        APIClient().get(LIST_URL)


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_detail_returns_200():
    e = EventFactory(slug="detail-test")
    res = APIClient().get(f"/api/v1/events/{e.slug}")
    assert res.status_code == 200


@pytest.mark.django_db
def test_detail_404_for_draft():
    e = EventFactory(status=EventStatus.DRAFT, slug="draft-detail")
    res = APIClient().get(f"/api/v1/events/{e.slug}")
    assert res.status_code == 404


@pytest.mark.django_db
def test_detail_seats_remaining_with_capacity():
    e = EventFactory(capacity=10, seats_taken=3)
    res = APIClient().get(f"/api/v1/events/{e.slug}")
    assert res.json()["seats_remaining"] == 7


@pytest.mark.django_db
def test_detail_seats_remaining_null_when_no_capacity():
    e = EventFactory(capacity=None)
    res = APIClient().get(f"/api/v1/events/{e.slug}")
    assert res.json()["seats_remaining"] is None


@pytest.mark.django_db
def test_detail_has_host_name():
    e = EventFactory()
    res = APIClient().get(f"/api/v1/events/{e.slug}")
    data = res.json()
    assert "host_name" in data


@pytest.mark.django_db
def test_detail_has_description():
    e = EventFactory(description="Full description text.")
    res = APIClient().get(f"/api/v1/events/{e.slug}")
    assert res.json()["description"] == "Full description text."


# ---------------------------------------------------------------------------
# Recording gating
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_recording_access_none_everyone_sees_url():
    """recording_access=none → any visitor can see recording_url."""
    e = EventFactory(
        recording_url="https://cdn.test/rec.mp4",
        recording_access=RecordingAccess.NONE,
    )
    res = APIClient().get(f"/api/v1/events/{e.slug}")
    assert res.json()["recording_url"] == "https://cdn.test/rec.mp4"


@pytest.mark.django_db
def test_recording_access_klub_anonymous_sees_none():
    e = EventFactory(
        recording_url="https://cdn.test/rec.mp4",
        recording_access=RecordingAccess.KLUB,
    )
    res = APIClient().get(f"/api/v1/events/{e.slug}")
    assert res.json()["recording_url"] is None


@pytest.mark.django_db
def test_recording_access_klub_free_user_sees_none():
    e = EventFactory(
        recording_url="https://cdn.test/rec.mp4",
        recording_access=RecordingAccess.KLUB,
    )
    c = _auth(UserFactory())
    assert c.get(f"/api/v1/events/{e.slug}").json()["recording_url"] is None


@pytest.mark.django_db
def test_recording_access_klub_solo_subscriber_sees_url():
    e = EventFactory(
        recording_url="https://cdn.test/rec.mp4",
        recording_access=RecordingAccess.KLUB,
    )
    c = _auth(_klub_user())
    assert c.get(f"/api/v1/events/{e.slug}").json()["recording_url"] == "https://cdn.test/rec.mp4"


@pytest.mark.django_db
def test_recording_access_klan_klub_user_sees_none():
    e = EventFactory(
        recording_url="https://cdn.test/rec.mp4",
        recording_access=RecordingAccess.KLAN,
    )
    c = _auth(_klub_user())
    assert c.get(f"/api/v1/events/{e.slug}").json()["recording_url"] is None


@pytest.mark.django_db
def test_recording_access_klan_klan_user_sees_url():
    e = EventFactory(
        recording_url="https://cdn.test/rec.mp4",
        recording_access=RecordingAccess.KLAN,
    )
    c = _auth(_klan_user())
    assert c.get(f"/api/v1/events/{e.slug}").json()["recording_url"] == "https://cdn.test/rec.mp4"


@pytest.mark.django_db
def test_recording_access_klan_patron_sees_url():
    e = EventFactory(
        recording_url="https://cdn.test/rec.mp4",
        recording_access=RecordingAccess.KLAN,
    )
    patron_user = UserFactory()
    tier = PatronTierFactory()
    PatronageFactory(user=patron_user, tier=tier, status=PatronageStatus.PAID)
    c = _auth(patron_user)
    assert c.get(f"/api/v1/events/{e.slug}").json()["recording_url"] == "https://cdn.test/rec.mp4"


@pytest.mark.django_db
def test_recording_url_none_when_empty():
    """No recording_url at all → field is None regardless of access level."""
    e = EventFactory(recording_url="", recording_access=RecordingAccess.NONE)
    res = APIClient().get(f"/api/v1/events/{e.slug}")
    assert res.json()["recording_url"] is None


@pytest.mark.django_db
def test_bad_token_fallback_to_anon_on_gated_recording():
    """Expired/invalid token must NOT return 401 on public endpoint."""
    e = EventFactory(
        recording_url="https://cdn.test/rec.mp4",
        recording_access=RecordingAccess.KLUB,
    )
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION="Token badtokendead")
    res = c.get(f"/api/v1/events/{e.slug}")
    assert res.status_code == 200
    assert res.json()["recording_url"] is None  # treated as anon

"""Task 5 — trigger tests: reply, waitlist-promote, sub activation, StreamStatus broadcast."""

import pytest
from rest_framework.test import APIClient

from accounts.tests.factories import (  # noqa: E402
    UserFactory,
)
from community.models import PostStatus
from community.services import create_post
from community.tests.factories import CategoryFactory, ThreadFactory
from events.models import RegStatus
from events.services import cancel_registration
from events.tests.factories import EventFactory, RegistrationFactory
from membership.models import PlanCode, SubStatus
from membership.tests.factories import PlanFactory, SubscriptionFactory
from notifications.models import Notification, NotificationKind, StreamStatus

# ---------------------------------------------------------------------------
# Community: reply triggers
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_reply_by_different_author_creates_notification():
    """Reply (published, different author) → thread.author gets REPLY notification."""
    thread_author = UserFactory()
    replier = UserFactory()
    category = CategoryFactory(is_moderated=False)
    thread = ThreadFactory(author=thread_author, category=category)

    post = create_post(user=replier, thread=thread, body="Odpowiedź testowa")

    assert post.status == PostStatus.PUBLISHED
    notifs = Notification.objects.filter(user=thread_author, kind=NotificationKind.REPLY)
    assert notifs.count() == 1
    n = notifs.first()
    assert thread.slug in n.url
    assert n.payload["post_id"] == post.id


@pytest.mark.django_db
def test_reply_to_own_thread_no_notification():
    """Reply by thread.author → no self-notification."""
    author = UserFactory()
    category = CategoryFactory(is_moderated=False)
    thread = ThreadFactory(author=author, category=category)

    create_post(user=author, thread=thread, body="Własna odpowiedź")

    assert Notification.objects.filter(user=author, kind=NotificationKind.REPLY).count() == 0


@pytest.mark.django_db
def test_reply_in_moderated_category_no_notification():
    """Reply in moderated category is PENDING → no notification."""
    thread_author = UserFactory()
    replier = UserFactory()
    category = CategoryFactory(is_moderated=True)
    thread = ThreadFactory(author=thread_author, category=category)

    post = create_post(user=replier, thread=thread, body="Pending reply")

    assert post.status == PostStatus.PENDING
    assert Notification.objects.filter(user=thread_author, kind=NotificationKind.REPLY).count() == 0


# ---------------------------------------------------------------------------
# Events: waitlist promotion trigger
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_cancel_registration_promotes_waitlisted_and_notifies():
    """Cancel CONFIRMED reg when waitlist exists → promoted user gets EVENT notification."""
    event = EventFactory(capacity=1)
    confirmed_user = UserFactory()
    waitlisted_user = UserFactory()

    RegistrationFactory(event=event, user=confirmed_user, status=RegStatus.CONFIRMED)
    waitlisted_reg = RegistrationFactory(
        event=event, user=waitlisted_user, status=RegStatus.WAITLISTED
    )

    cancel_registration(user=confirmed_user, event=event)

    waitlisted_reg.refresh_from_db()
    assert waitlisted_reg.status == RegStatus.CONFIRMED

    notifs = Notification.objects.filter(user=waitlisted_user, kind=NotificationKind.EVENT)
    assert notifs.count() == 1
    n = notifs.first()
    assert event.slug in n.url
    assert n.payload["event_slug"] == event.slug


@pytest.mark.django_db
def test_cancel_registration_no_waitlist_no_notification():
    """Cancel CONFIRMED reg with no waitlist → no EVENT notification."""
    event = EventFactory(capacity=2)
    user = UserFactory()
    RegistrationFactory(event=event, user=user, status=RegStatus.CONFIRMED)

    cancel_registration(user=user, event=event)

    assert Notification.objects.filter(kind=NotificationKind.EVENT).count() == 0


# ---------------------------------------------------------------------------
# Membership: subscription activation trigger
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_webhook_subscription_activation_notifies_user(monkeypatch):
    """INCOMPLETE→ACTIVE checkout webhook → sub.user gets MEMBERSHIP notification."""
    plan = PlanFactory(code=PlanCode.SOLO, price_month=29, price_year=24)
    user = UserFactory()
    sub = SubscriptionFactory(
        user=user, plan=plan, status=SubStatus.INCOMPLETE, stripe_customer_id=""
    )
    event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "mode": "subscription",
                "customer": "cus_trigger",
                "subscription": "sub_trigger",
                "metadata": {"subscription_id": str(sub.id)},
            }
        },
    }
    monkeypatch.setattr("membership.payments.construct_event", lambda **kwargs: event)

    r = APIClient().post(
        "/api/v1/membership/stripe/webhook",
        data=b"{}",
        content_type="application/json",
        HTTP_STRIPE_SIGNATURE="t=1,v1=deadbeef",
    )

    assert r.status_code == 200
    sub.refresh_from_db()
    assert sub.status == SubStatus.ACTIVE

    notifs = Notification.objects.filter(user=user, kind=NotificationKind.MEMBERSHIP)
    assert notifs.count() == 1
    n = notifs.first()
    assert n.payload["plan"] == plan.code


# ---------------------------------------------------------------------------
# StreamStatus: post_save signal triggers broadcast
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_stream_status_save_triggers_broadcast_no_error():
    """Saving StreamStatus does not raise; broadcast_stream_status runs (best-effort)."""
    status = StreamStatus.load()
    status.is_live = True
    status.title = "Test stream"
    status.save()

    status.refresh_from_db()
    assert status.is_live is True
    assert status.title == "Test stream"

"""Task 5 - model tests for Subscriber and Campaign."""

import pytest

from newsletter.tests.factories import CampaignFactory, SubscriberFactory


@pytest.mark.django_db
def test_subscriber_token_generated_on_save():
    sub = SubscriberFactory()
    assert sub.unsubscribe_token
    assert len(sub.unsubscribe_token) >= 32


@pytest.mark.django_db
def test_subscriber_token_unique():
    s1 = SubscriberFactory()
    s2 = SubscriberFactory()
    assert s1.unsubscribe_token != s2.unsubscribe_token


@pytest.mark.django_db
def test_subscriber_default_active():
    sub = SubscriberFactory()
    assert sub.is_active is True


@pytest.mark.django_db
def test_subscriber_email_unique():
    from django.db import IntegrityError

    SubscriberFactory(email="dup@example.com")
    with pytest.raises(IntegrityError):
        SubscriberFactory(email="dup@example.com")


@pytest.mark.django_db
def test_subscriber_str():
    sub = SubscriberFactory(email="test@example.com")
    assert "test@example.com" in str(sub)


@pytest.mark.django_db
def test_campaign_str():
    c = CampaignFactory(code="welcome")
    assert "welcome" in str(c)


@pytest.mark.django_db
def test_campaign_default_active():
    c = CampaignFactory()
    assert c.is_active is True


@pytest.mark.django_db
def test_campaign_ordering():
    CampaignFactory(order=5, code="c")
    CampaignFactory(order=0, code="a")
    CampaignFactory(order=2, code="b")
    from newsletter.models import Campaign

    orders = list(Campaign.objects.values_list("order", flat=True))
    assert orders == sorted(orders)

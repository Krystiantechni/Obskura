import pytest

from catalog.tests.factories import SeasonFactory
from membership.models import Patronage, PatronTier
from membership.services import handle_webhook_event
from membership.tests.factories import PatronageFactory, PatronTierFactory


def _completed_payment_event(*, patronage_id, payment_intent="pi_test_1"):
    return {
        "id": "evt_test_payment",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_patron",
                "mode": "payment",
                "payment_intent": payment_intent,
                "metadata": {"patronage_id": str(patronage_id)},
            }
        },
    }


@pytest.mark.django_db
def test_webhook_marks_patronage_paid_and_records_intent():
    p = PatronageFactory(status=Patronage.PatronageStatus.PENDING)
    handle_webhook_event(event=_completed_payment_event(patronage_id=p.id))
    p.refresh_from_db()
    assert p.status == Patronage.PatronageStatus.PAID
    assert p.stripe_payment_intent_id == "pi_test_1"
    assert p.anon_number is None  # non-anonymous → no number


@pytest.mark.django_db
def test_webhook_assigns_sequential_anon_number_per_season():
    season = SeasonFactory()
    t1 = PatronTierFactory(season=season, code=PatronTier.PatronCode.WITNESS)
    t2 = PatronTierFactory(season=season, code=PatronTier.PatronCode.ALLY)
    p1 = PatronageFactory(tier=t1, is_anonymous=True, status=Patronage.PatronageStatus.PENDING)
    p2 = PatronageFactory(tier=t2, is_anonymous=True, status=Patronage.PatronageStatus.PENDING)
    handle_webhook_event(event=_completed_payment_event(patronage_id=p1.id, payment_intent="pi_a"))
    handle_webhook_event(event=_completed_payment_event(patronage_id=p2.id, payment_intent="pi_b"))
    p1.refresh_from_db()
    p2.refresh_from_db()
    assert p1.anon_number == 1
    assert p2.anon_number == 2  # sequential across tiers within the same season


@pytest.mark.django_db
def test_webhook_anon_number_isolated_between_seasons():
    s1, s2 = SeasonFactory(), SeasonFactory()
    ta = PatronTierFactory(season=s1, code=PatronTier.PatronCode.WITNESS)
    tb = PatronTierFactory(season=s2, code=PatronTier.PatronCode.WITNESS)
    pa = PatronageFactory(tier=ta, is_anonymous=True, status=Patronage.PatronageStatus.PENDING)
    pb = PatronageFactory(tier=tb, is_anonymous=True, status=Patronage.PatronageStatus.PENDING)
    handle_webhook_event(event=_completed_payment_event(patronage_id=pa.id, payment_intent="pi_a"))
    handle_webhook_event(event=_completed_payment_event(patronage_id=pb.id, payment_intent="pi_b"))
    pa.refresh_from_db()
    pb.refresh_from_db()
    # each season starts its own anonymous numbering at 1
    assert pa.anon_number == 1
    assert pb.anon_number == 1


@pytest.mark.django_db
def test_webhook_unknown_patronage_id_is_noop():
    # missing/invalid patronage_id must not raise (Stripe retries otherwise)
    handle_webhook_event(event=_completed_payment_event(patronage_id=999999))


@pytest.mark.django_db
def test_webhook_idempotent_paid_keeps_anon_number():
    p = PatronageFactory(is_anonymous=True, status=Patronage.PatronageStatus.PENDING)
    event = _completed_payment_event(patronage_id=p.id)
    handle_webhook_event(event=event)
    p.refresh_from_db()
    first = p.anon_number
    handle_webhook_event(event=event)  # duplicate delivery
    p.refresh_from_db()
    assert p.status == Patronage.PatronageStatus.PAID
    assert p.anon_number == first  # not re-incremented

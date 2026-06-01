from django.db import transaction
from django.utils import timezone

from membership import payments
from membership.models import BillingPeriod, PlanCode, Subscription, SubStatus


def current_period():
    """Bieżący miesiąc kalendarzowy jako 'YYYY-MM' (timezone-aware now)."""
    return timezone.now().strftime("%Y-%m")


def _price_id_for(*, plan, billing_period):
    if billing_period == BillingPeriod.YEAR:
        return plan.stripe_price_id_year
    return plan.stripe_price_id_month


def _apply_subscription_status(
    sub, *, status, period_end=None, trial_end=None, cancel_at_period_end=None
):
    """Wspólne mapowanie pól statusu subskrypcji (webhook updated/deleted/failed)."""
    fields = ["status"]
    sub.status = status
    if period_end is not None:
        sub.period_end = period_end
        fields.append("period_end")
    if trial_end is not None:
        sub.trial_end = trial_end
        fields.append("trial_end")
    if cancel_at_period_end is not None:
        sub.cancel_at_period_end = cancel_at_period_end
        fields.append("cancel_at_period_end")
    sub.save(update_fields=fields)


@transaction.atomic
def subscribe(*, user, plan, billing_period):
    """Subskrypcja Klubu.

    Plan free → lokalna aktywna subskrypcja bez Stripe ({"status": "active"}).
    Plan płatny → Checkout Session + wiersz incomplete ({"checkout_url": ...}).
    Trial 30 dni tylko przy pierwszej subskrypcji użytkownika (anty-abuse).
    """
    if plan.code == PlanCode.FREE:
        Subscription.objects.update_or_create(
            user=user,
            defaults={
                "plan": plan,
                "status": SubStatus.ACTIVE,
                "billing_period": billing_period,
            },
        )
        return {"status": "active"}

    had_prior = Subscription.objects.filter(user=user).exists()
    trial_days = 0 if had_prior else 30

    Subscription.objects.create(
        user=user,
        plan=plan,
        status=SubStatus.INCOMPLETE,
        billing_period=billing_period,
    )
    session = payments.create_subscription_checkout(
        user=user,
        price_id=_price_id_for(plan=plan, billing_period=billing_period),
        trial_days=trial_days,
    )
    return {"checkout_url": session.url}


@transaction.atomic
def cancel_subscription(*, user):
    """Anulowanie na koniec okresu: flaga lokalna + Stripe cancel_at_period_end."""
    sub = (
        Subscription.objects.select_related("plan")
        .filter(user=user, status__in=[SubStatus.TRIALING, SubStatus.ACTIVE])
        .first()
    )
    if sub is None:
        return None
    if sub.stripe_subscription_id:
        payments.cancel_at_period_end(stripe_subscription_id=sub.stripe_subscription_id)
    sub.cancel_at_period_end = True
    sub.save(update_fields=["cancel_at_period_end"])
    return sub


def _epoch_to_dt(value):
    if not value:
        return None
    return timezone.datetime.fromtimestamp(value, tz=timezone.get_current_timezone())


_STRIPE_STATUS_MAP = {
    "trialing": SubStatus.TRIALING,
    "active": SubStatus.ACTIVE,
    "past_due": SubStatus.PAST_DUE,
    "canceled": SubStatus.CANCELED,
    "incomplete": SubStatus.INCOMPLETE,
    "incomplete_expired": SubStatus.EXPIRED,
    "unpaid": SubStatus.PAST_DUE,
}


@transaction.atomic
def handle_webhook_event(*, event):
    """Dyspozytor zdarzeń Stripe dla subskrypcji Klubu."""
    event_type = event.get("type")
    obj = event.get("data", {}).get("object", {})

    if event_type == "checkout.session.completed" and obj.get("mode") == "subscription":
        sub = _resolve_subscription(obj)
        if sub is not None:
            sub.stripe_customer_id = obj.get("customer", "") or ""
            sub.stripe_subscription_id = obj.get("subscription", "") or ""
            sub.status = SubStatus.ACTIVE
            sub.save(update_fields=["stripe_customer_id", "stripe_subscription_id", "status"])
        return

    if event_type == "customer.subscription.updated":
        sub = _sub_by_stripe_id(obj.get("id"))
        if sub is not None:
            _apply_subscription_status(
                sub,
                status=_STRIPE_STATUS_MAP.get(obj.get("status"), sub.status),
                period_end=_epoch_to_dt(obj.get("current_period_end")),
                trial_end=_epoch_to_dt(obj.get("trial_end")),
                cancel_at_period_end=obj.get("cancel_at_period_end"),
            )
        return

    if event_type == "customer.subscription.deleted":
        sub = _sub_by_stripe_id(obj.get("id"))
        if sub is not None:
            _apply_subscription_status(sub, status=SubStatus.CANCELED)
        return

    if event_type == "invoice.payment_failed":
        sub = _sub_by_stripe_id(obj.get("subscription"))
        if sub is not None:
            _apply_subscription_status(sub, status=SubStatus.PAST_DUE)
        return


def _resolve_subscription(obj):
    """Z Checkout Session do lokalnej subskrypcji, w kolejności:
    1) metadata.subscription_id (lokalny pk, jeśli kiedyś ustawione),
    2) stripe_subscription_id (gdy już powiązane),
    3) po użytkowniku (client_reference_id / metadata.user_id) -> najnowsza INCOMPLETE.

    Krok 3 to realny kształt sesji z payments.create_subscription_checkout, które
    wstawia client_reference_id=user.pk i metadata.user_id (bez subscription_id).
    """
    sub_id = (obj.get("metadata") or {}).get("subscription_id")
    if sub_id:
        sub = Subscription.objects.filter(pk=sub_id).first()
        if sub is not None:
            return sub
    sub = _sub_by_stripe_id(obj.get("subscription"))
    if sub is not None:
        return sub
    user_id = obj.get("client_reference_id") or (obj.get("metadata") or {}).get("user_id")
    if user_id:
        return (
            Subscription.objects.filter(user_id=user_id, status=SubStatus.INCOMPLETE)
            .order_by("-created_at")
            .first()
        )
    return None


def _sub_by_stripe_id(stripe_subscription_id):
    if not stripe_subscription_id:
        return None
    return Subscription.objects.filter(stripe_subscription_id=stripe_subscription_id).first()

"""sync_stripe_prices — create/reuse Stripe Products + Prices, store ids.

Subscription prices (month + year) for paid plans solo/klan.
One-time prices for paid patron tiers.
No-op (with a message) when STRIPE_SECRET_KEY is not configured.
"""

from django.conf import settings
from django.core.management.base import BaseCommand

from membership import payments
from membership.models import PatronTier, Plan, PlanCode

# Plan codes that carry paid Stripe prices (free has none).
PAID_PLAN_CODES = (PlanCode.SOLO, PlanCode.KLAN)


class Command(BaseCommand):
    help = "Create/reuse Stripe Products and Prices for paid plans and tiers."

    def handle(self, *args, **options):
        if not settings.STRIPE_SECRET_KEY:
            self.stdout.write(
                self.style.WARNING(
                    "STRIPE_SECRET_KEY not set — skipping Stripe price sync. "
                    "Set the key in the environment to enable this command."
                )
            )
            return

        plan_count = self._sync_plans()
        tier_count = self._sync_tiers()

        self.stdout.write(
            self.style.SUCCESS(
                f"sync_stripe_prices done — "
                f"{plan_count} plan prices, {tier_count} tier prices synced."
            )
        )

    # ------------------------------------------------------------------
    # Plans (recurring: month + year)
    # ------------------------------------------------------------------

    def _sync_plans(self) -> int:
        synced = 0
        for plan in Plan.objects.filter(code__in=PAID_PLAN_CODES):
            if plan.stripe_price_id_month and plan.stripe_price_id_year:
                self.stdout.write(f"  plan {plan.code}: skip (already synced)")
                continue
            # unit_amount w całych PLN — payments.ensure_product_and_price sam
            # konwertuje na grosze (×100). recurring to dict {"interval": ...}.
            price_id_month = payments.ensure_product_and_price(
                name=f"OBSKURA Klub {plan.name} (miesięcznie)",
                unit_amount=plan.price_month,
                currency=plan.currency.lower(),
                recurring={"interval": "month"},
            )
            # Yearly billing: price_year is the monthly rate when paid yearly;
            # the recurring yearly amount is price_year * 12 (w całych PLN).
            price_id_year = payments.ensure_product_and_price(
                name=f"OBSKURA Klub {plan.name} (rocznie)",
                unit_amount=plan.price_year * 12,
                currency=plan.currency.lower(),
                recurring={"interval": "year"},
            )
            plan.stripe_price_id_month = price_id_month
            plan.stripe_price_id_year = price_id_year
            plan.save(update_fields=["stripe_price_id_month", "stripe_price_id_year"])
            synced += 1
            self.stdout.write(f"  plan {plan.code}: month={price_id_month} year={price_id_year}")
        return synced

    # ------------------------------------------------------------------
    # Patron tiers (one-time)
    # ------------------------------------------------------------------

    def _sync_tiers(self) -> int:
        synced = 0
        for tier in PatronTier.objects.filter(amount__gt=0).select_related("season"):
            if tier.stripe_price_id:
                self.stdout.write(
                    f"  tier {tier.code} (s{tier.season.number}): skip (already synced)"
                )
                continue
            price_id = payments.ensure_product_and_price(
                name=f"OBSKURA Patronat {tier.title} ({tier.season.title})",
                unit_amount=tier.amount,
                currency=tier.currency.lower(),
                recurring=None,
            )
            tier.stripe_price_id = price_id
            tier.save(update_fields=["stripe_price_id"])
            synced += 1
            self.stdout.write(f"  tier {tier.code} (s{tier.season.number}): {price_id}")
        return synced

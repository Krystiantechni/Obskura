from django.contrib import admin

from membership.models import (
    FreePlayGrant,
    Patronage,
    PatronTier,
    Plan,
    Subscription,
)


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = [
        "code",
        "name",
        "price_month",
        "price_year",
        "featured",
        "monthly_quota",
        "is_active",
        "order",
    ]
    list_filter = ["featured", "is_active"]
    search_fields = ["code", "name"]
    ordering = ["order"]


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "plan",
        "status",
        "billing_period",
        "period_end",
        "cancel_at_period_end",
        "auto_renew",
    ]
    list_filter = ["status", "billing_period", "auto_renew", "cancel_at_period_end"]
    list_select_related = ["user", "plan"]
    autocomplete_fields = ["user", "plan"]
    search_fields = ["user__email", "plan__code", "stripe_subscription_id"]


@admin.register(PatronTier)
class PatronTierAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "code",
        "season",
        "amount",
        "featured",
        "capacity",
        "requires_application",
        "is_active",
        "order",
    ]
    list_filter = ["code", "featured", "requires_application", "is_active", "season"]
    list_select_related = ["season"]
    autocomplete_fields = ["season"]
    search_fields = ["title", "role_label", "code"]
    ordering = ["order"]


@admin.register(Patronage)
class PatronageAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "tier",
        "amount",
        "status",
        "is_anonymous",
        "anon_number",
        "is_company",
        "created_at",
    ]
    list_filter = ["status", "is_anonymous", "is_company"]
    list_select_related = ["user", "tier", "tier__season"]
    autocomplete_fields = ["user", "tier"]
    search_fields = ["user__email", "credit_name", "company_name", "stripe_payment_intent_id"]


@admin.register(FreePlayGrant)
class FreePlayGrantAdmin(admin.ModelAdmin):
    list_display = ["user", "episode", "period", "created_at"]
    list_filter = ["period"]
    list_select_related = ["user", "episode"]
    autocomplete_fields = ["user", "episode"]
    search_fields = ["user__email", "episode__title", "period"]

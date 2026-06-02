from django.contrib import admin

from events.models import Event, Registration


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "mode",
        "status",
        "is_featured",
        "starts_at",
        "capacity",
        "seats_taken",
        "price_pln",
        "is_free",
    ]
    list_filter = ["mode", "status", "is_featured"]
    search_fields = ["title", "slug"]
    list_select_related = ["host"]
    autocomplete_fields = ["host"]
    prepopulated_fields = {"slug": ("title",)}
    date_hierarchy = "starts_at"
    readonly_fields = ["is_free", "seats_taken", "created_at", "updated_at"]


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = [
        "event",
        "user",
        "status",
        "created_at",
    ]
    list_filter = ["status"]
    search_fields = ["event__title", "event__slug", "user__email"]
    list_select_related = ["event", "user"]
    readonly_fields = [
        "stripe_checkout_session_id",
        "stripe_payment_intent_id",
        "created_at",
        "updated_at",
    ]

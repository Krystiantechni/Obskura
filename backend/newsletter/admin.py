from django.contrib import admin

from newsletter.models import Campaign, Subscriber


@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display = ["email", "freq", "is_active", "consent_at"]
    list_filter = ["freq", "is_active"]
    search_fields = ["email"]
    date_hierarchy = "created_at"


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ["code", "label", "tag", "order", "is_active"]
    list_filter = ["tag", "is_active"]
    search_fields = ["code", "label"]

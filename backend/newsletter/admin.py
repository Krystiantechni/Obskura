from django.contrib import admin, messages

from newsletter.models import Campaign, Subscriber
from newsletter.tasks import send_campaign_task


@admin.action(description="Wyślij kampanię do aktywnych subskrybentów")
def send_to_subscribers(modeladmin, request, queryset):
    total = 0
    for campaign in queryset:
        total += send_campaign_task.delay(campaign.code).get() or 0
    messages.success(request, f"Zakolejkowano {total} wiadomości.")


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
    actions = [send_to_subscribers]

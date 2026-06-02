from django.contrib import admin

from notifications.models import Notification, StreamStatus


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "kind", "title", "read_at", "created_at")
    list_filter = ("kind", "read_at")
    search_fields = ("title", "user__email")
    list_select_related = ("user",)
    date_hierarchy = "created_at"


@admin.register(StreamStatus)
class StreamStatusAdmin(admin.ModelAdmin):
    list_display = ("is_live", "title", "started_at")

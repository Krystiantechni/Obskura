from django.contrib import admin

from playback.models import Favorite, Progress, QueueItem, Rating


@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    list_display = ["user", "episode", "position_s", "completed", "updated_at"]
    list_filter = ["completed"]
    list_select_related = ["user", "episode"]
    autocomplete_fields = ["user", "episode"]
    search_fields = ["user__email", "episode__title"]


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ["user", "episode", "created_at"]
    list_select_related = ["user", "episode"]
    autocomplete_fields = ["user", "episode"]
    search_fields = ["user__email", "episode__title"]


@admin.register(QueueItem)
class QueueItemAdmin(admin.ModelAdmin):
    list_display = ["user", "episode", "position", "created_at"]
    list_select_related = ["user", "episode"]
    autocomplete_fields = ["user", "episode"]
    search_fields = ["user__email", "episode__title"]


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ["user", "episode", "value", "created_at"]
    list_filter = ["value"]
    list_select_related = ["user", "episode"]
    autocomplete_fields = ["user", "episode"]
    search_fields = ["user__email", "episode__title"]

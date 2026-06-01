from django.contrib import admin

from catalog.models import Chapter, Creator, Episode, Genre, Season, TranscriptLine


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "accent"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name", "slug"]


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ["number", "title", "slug", "published_at"]
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ["title", "slug"]
    ordering = ["-number"]


@admin.register(Creator)
class CreatorAdmin(admin.ModelAdmin):
    list_display = ["name", "role", "slug"]
    list_filter = ["role"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name", "slug"]


class ChapterInline(admin.TabularInline):
    model = Chapter
    extra = 0
    fields = ["n", "key", "title", "time_str", "sec"]
    ordering = ["n"]


@admin.register(Episode)
class EpisodeAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "season",
        "number",
        "genre",
        "premium",
        "is_true_horror",
        "published_at",
    ]
    list_filter = ["premium", "is_true_horror", "kind", "genre", "season"]
    search_fields = ["title", "title_em", "slug"]
    list_select_related = ["season", "genre"]
    autocomplete_fields = ["season", "genre", "creators"]
    prepopulated_fields = {"slug": ("title",)}
    date_hierarchy = "published_at"
    inlines = [ChapterInline]


@admin.register(TranscriptLine)
class TranscriptLineAdmin(admin.ModelAdmin):
    list_display = ["episode", "order", "speaker", "marker", "sec", "text"]
    list_filter = ["marker", "speaker"]
    list_select_related = ["episode"]
    autocomplete_fields = ["episode"]
    search_fields = ["episode__title", "text", "speaker"]

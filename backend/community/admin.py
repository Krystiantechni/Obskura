from django.contrib import admin

from community.models import (
    Category,
    ModerationAction,
    Post,
    Reaction,
    Report,
    Thread,
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "slug",
        "icon",
        "is_moderated",
        "order",
        "is_active",
        "threads_count",
    ]
    list_filter = ["is_moderated", "is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    ordering = ["order"]
    readonly_fields = ["threads_count"]


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "category",
        "author",
        "episode",
        "is_pinned",
        "is_locked",
        "posts_count",
        "views_count",
        "last_post_at",
    ]
    list_filter = ["is_pinned", "is_locked", "is_deleted", "category"]
    search_fields = ["title", "slug", "author__email"]
    list_select_related = ["category", "author", "episode"]
    autocomplete_fields = ["category", "author", "episode"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ["posts_count", "views_count", "last_post_at"]
    date_hierarchy = "created_at"


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = [
        "thread",
        "author",
        "is_first",
        "status",
        "reaction_count",
        "created_at",
    ]
    list_filter = ["status", "is_first", "is_deleted"]
    search_fields = ["body", "author__email", "thread__title"]
    list_select_related = ["thread", "author"]
    autocomplete_fields = ["thread", "author"]
    readonly_fields = ["reaction_count", "reactions_breakdown"]
    date_hierarchy = "created_at"


@admin.register(Reaction)
class ReactionAdmin(admin.ModelAdmin):
    list_display = ["post", "user", "kind", "created_at"]
    list_filter = ["kind"]
    search_fields = ["user__email", "post__thread__title"]
    list_select_related = ["post", "user"]
    autocomplete_fields = ["post", "user"]


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = [
        "post",
        "reporter",
        "reason",
        "status",
        "handled_by",
        "created_at",
    ]
    list_filter = ["status", "reason"]
    search_fields = ["reporter__email", "handled_by__email", "post__thread__title"]
    list_select_related = ["post", "reporter", "handled_by"]
    autocomplete_fields = ["post", "reporter", "handled_by"]


@admin.register(ModerationAction)
class ModerationActionAdmin(admin.ModelAdmin):
    list_display = ["action", "moderator", "post", "thread", "created_at"]
    list_filter = ["action"]
    search_fields = ["moderator__email", "reason", "thread__title"]
    list_select_related = ["moderator", "post", "thread"]
    autocomplete_fields = ["moderator", "post", "thread"]
    readonly_fields = ["moderator", "post", "thread", "action", "reason", "created_at"]

    def has_add_permission(self, request):
        # Audit log is append-only — entries are written by services, never by hand.
        return False

    def has_change_permission(self, request, obj=None):
        return False

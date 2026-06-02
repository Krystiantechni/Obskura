from django.contrib import admin

from support.models import FaqCategory, FaqItem, Ticket


@admin.register(FaqCategory)
class FaqCategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("name",)}
    list_display = ["name", "slug", "order", "is_active"]


@admin.register(FaqItem)
class FaqItemAdmin(admin.ModelAdmin):
    list_display = ["category", "question", "order", "is_active"]
    list_filter = ["is_active", "category"]
    list_select_related = ["category"]
    search_fields = ["question"]


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "category", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["email", "name"]
    date_hierarchy = "created_at"

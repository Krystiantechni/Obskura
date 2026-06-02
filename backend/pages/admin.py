from django.contrib import admin

from pages.models import LegalDoc, PressItem


@admin.register(LegalDoc)
class LegalDocAdmin(admin.ModelAdmin):
    list_display = ["kind", "version", "is_current", "published_at"]
    list_filter = ["kind", "is_current"]


@admin.register(PressItem)
class PressItemAdmin(admin.ModelAdmin):
    list_display = ["source", "author", "order", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["source", "author"]

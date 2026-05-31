from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from accounts.models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["-date_joined"]
    list_display = ["email", "display_name", "is_active", "is_staff", "date_joined"]
    search_fields = ["email", "display_name"]
    list_filter = ["is_active", "is_staff", "is_superuser"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profil", {"fields": ("display_name", "prefs")}),
        (
            "Uprawnienia",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Daty", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = ((None, {"classes": ("wide",), "fields": ("email", "password1", "password2")}),)
    readonly_fields = ["date_joined", "last_login"]

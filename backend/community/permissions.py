from rest_framework.permissions import BasePermission


class IsModerator(BasePermission):
    """Dostęp tylko dla moderatorów: is_moderator, personel lub superużytkownik."""

    message = "Wymagane uprawnienia moderatora."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return bool(getattr(user, "is_moderator", False) or user.is_staff or user.is_superuser)

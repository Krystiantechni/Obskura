import pytest
from django.apps import apps
from django.contrib.auth import get_user_model

User = get_user_model()


def test_app_installed():
    """community is registered with the expected AppConfig and label."""
    config = apps.get_app_config("community")
    assert config.name == "community"
    assert type(config).__name__ == "CommunityConfig"


def test_urls_module_importable():
    """community.urls exposes a urlpatterns list (wired into obskura.urls)."""
    from community import urls

    assert isinstance(urls.urlpatterns, list)


def test_layer_modules_importable():
    """Every layer placeholder imports cleanly so later tasks can fill them in."""
    from community import (  # noqa: F401
        admin,
        models,
        selectors,
        serializers,
        services,
        signals,
        views,
    )


def test_is_moderator_permission_importable():
    """permissions.IsModerator is importable and is a DRF permission class."""
    from rest_framework.permissions import BasePermission

    from community.permissions import IsModerator

    assert issubclass(IsModerator, BasePermission)


@pytest.mark.django_db
def test_user_has_is_moderator_field():
    """accounts.User gained the additive is_moderator flag (default False)."""
    field = User._meta.get_field("is_moderator")
    assert field.default is False

    user = User.objects.create_user(email="mod-scaffold@example.com", password="Secret123")
    assert user.is_moderator is False

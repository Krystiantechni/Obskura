import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
def test_create_user_normalizes_email_and_hashes_password():
    user = User.objects.create_user(email="Test@Example.COM", password="Secret123")
    assert user.email == "Test@example.com"
    assert user.password != "Secret123"
    assert user.check_password("Secret123") is True
    assert user.is_active is True
    assert user.is_staff is False


@pytest.mark.django_db
def test_create_user_requires_email():
    with pytest.raises(ValueError):
        User.objects.create_user(email="", password="Secret123")


@pytest.mark.django_db
def test_create_superuser_flags():
    admin = User.objects.create_superuser(email="a@b.com", password="Secret123")
    assert admin.is_staff is True
    assert admin.is_superuser is True


@pytest.mark.django_db
def test_create_superuser_rejects_non_staff():
    with pytest.raises(ValueError, match="is_staff"):
        User.objects.create_superuser(email="a@b.com", password="Secret123", is_staff=False)


@pytest.mark.django_db
def test_create_superuser_rejects_non_superuser():
    with pytest.raises(ValueError, match="is_superuser"):
        User.objects.create_superuser(email="a@b.com", password="Secret123", is_superuser=False)


@pytest.mark.django_db
def test_email_is_username_field_and_str():
    user = User.objects.create_user(email="x@y.com", password="Secret123")
    assert User.USERNAME_FIELD == "email"
    assert str(user) == "x@y.com"
    assert user.prefs == {}

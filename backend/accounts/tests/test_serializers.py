import pytest

from accounts.serializers import LoginSerializer, RegisterSerializer
from accounts.tests.factories import UserFactory


@pytest.mark.django_db
def test_register_serializer_valid_creates_user():
    s = RegisterSerializer(
        data={
            "email": "new@example.com",
            "password": "Secret123",
            "name": "Nowy User",
            "terms": True,
        }
    )
    assert s.is_valid(), s.errors
    user = s.save()
    assert user.email == "new@example.com"
    assert user.display_name == "Nowy User"
    assert user.check_password("Secret123")


@pytest.mark.django_db
@pytest.mark.parametrize("password", ["short1A", "nouppercase1", "NOLOWERORDIGIT"])
def test_register_serializer_rejects_weak_password(password):
    s = RegisterSerializer(
        data={
            "email": "x@example.com",
            "password": password,
            "name": "Ok Name",
            "terms": True,
        }
    )
    assert not s.is_valid()
    assert "password" in s.errors


@pytest.mark.django_db
def test_register_serializer_requires_terms():
    s = RegisterSerializer(
        data={
            "email": "x@example.com",
            "password": "Secret123",
            "name": "Ok Name",
            "terms": False,
        }
    )
    assert not s.is_valid()
    assert "terms" in s.errors


@pytest.mark.django_db
def test_register_serializer_rejects_duplicate_email():
    UserFactory(email="taken@example.com")
    s = RegisterSerializer(
        data={
            "email": "taken@example.com",
            "password": "Secret123",
            "name": "Some Name",
            "terms": True,
        }
    )
    assert not s.is_valid()
    assert "email" in s.errors


def test_login_serializer_validates_shape():
    assert LoginSerializer(data={"email": "x@example.com", "password": "Secret123"}).is_valid()
    assert not LoginSerializer(data={"email": "bad", "password": "x"}).is_valid()

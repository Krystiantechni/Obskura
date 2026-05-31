# Faza B1 — Auth + accounts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Custom user (`accounts.User`, logowanie emailem) + Knox token auth + endpointy register/login/logout/logoutall i `/accounts/me` (+ prefs), z walidacją lustrzaną do frontowego Zod i throttlingiem anty-brute-force.

**Architecture:** Nowa app `accounts/`. `User(AbstractBaseUser, PermissionsMixin)` — email jako `USERNAME_FIELD`, `UserManager` z `create_user`/`create_superuser`, `prefs` JSONB. Auth tokenowy przez **django-rest-knox** (już w `INSTALLED_APPS` z B0). Serializery rozdzielone read/write; walidacja = lustro `src/lib/formSchemas.js` (te same reguły i komunikaty PL). Cienkie widoki — logika rejestracji w `UserManager.create_user`. Throttling scoped na login/register.

**Tech Stack:** Django 5.2 · DRF · django-rest-knox 5 · PostgreSQL (JSONB). Testy: pytest + pytest-django (+ APIClient).

> **Konwencje (z B0):** commity po ANGIELSKU (subject+body), bez `Co-Authored-By`. Branch roboczy `feat/backend-b1`. Testy w kontenerze: `docker compose run --rm web pytest`. Lint czysty przed każdym commitem (`ruff check` + `ruff format --check`).

## Decyzje projektowe (rozstrzygnięte tu)

1. **`User` NIE dziedziczy `SoftDeleteModel`** — `is_active=False` służy do dezaktywacji konta (standard Django, kompatybilne z auth backendem). Behawioralne testy soft-delete (odłożone z B0) zrobimy w B2 na czystym modelu katalogu, gdzie nie ma konfliktu z `BaseUserManager`.
2. **`User` NIE dziedziczy `TimeStampedModel`** — ma własne `date_joined` (konwencja auth). YAGNI: `updated_at` dołożymy, jeśli zajdzie potrzeba.
3. **Pole API `name`** (lustro Zod `registerSchema`) mapuje się na `User.display_name`.
4. **Login** = custom `APIView` (email+password → `authenticate` → `AuthToken`), nie domyślny knox `LoginView` (ten zakłada Basic Auth). Logout/logoutall = gotowe widoki knox.
5. **Komunikaty walidacji po polsku** (user-facing, lustro Zod). Komentarze w kodzie i commity po angielsku.

## File Structure

```
backend/accounts/
  __init__.py
  apps.py
  models.py          # User(AbstractBaseUser, PermissionsMixin)
  managers.py        # UserManager(BaseUserManager)
  serializers.py     # Register/Login/UserRead/MeUpdate/Prefs
  views.py           # RegisterView, LoginView, MeView, MePrefsView
  urls.py            # /auth/* + /accounts/me*
  admin.py           # UserAdmin
  migrations/__init__.py
  tests/
    __init__.py
    factories.py     # UserFactory (factory_boy)
    test_models.py
    test_serializers.py
    test_auth.py
    test_accounts.py
    test_throttling.py
backend/obskura/settings.py   # AUTH_USER_MODEL, accounts w INSTALLED_APPS, throttle rates
backend/obskura/urls.py       # include accounts.urls
```

---

## Task 1: accounts app + User model + UserManager (TDD)

**Files:**
- Create: `backend/accounts/{__init__.py,apps.py,managers.py,models.py,migrations/__init__.py}`
- Create: `backend/accounts/tests/{__init__.py,test_models.py}`
- Modify: `backend/obskura/settings.py` (AUTH_USER_MODEL + INSTALLED_APPS)

- [ ] **Step 1: Failing test**

`backend/accounts/__init__.py`, `backend/accounts/migrations/__init__.py`, `backend/accounts/tests/__init__.py`: puste.

`backend/accounts/tests/test_models.py`:
```python
import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
def test_create_user_normalizes_email_and_hashes_password():
    user = User.objects.create_user(email="Test@Example.COM", password="Secret123")
    assert user.email == "Test@example.com"  # domena znormalizowana
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
def test_email_is_username_field_and_str():
    user = User.objects.create_user(email="x@y.com", password="Secret123")
    assert User.USERNAME_FIELD == "email"
    assert str(user) == "x@y.com"
    assert user.prefs == {}
```

- [ ] **Step 2: Run — expect FAIL**

Run: `docker compose run --rm web pytest accounts/tests/test_models.py -v`
Expected: błąd — `accounts` nie w INSTALLED_APPS / model nie istnieje.

- [ ] **Step 3: Manager**

`backend/accounts/managers.py`:
```python
from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Email jest wymagany.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self._create_user(email, password, **extra_fields)
```

- [ ] **Step 4: Model**

`backend/accounts/models.py`:
```python
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from accounts.managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """Użytkownik z logowaniem emailem. prefs (JSONB) trzyma ustawienia onboardingu."""

    email = models.EmailField(unique=True, db_index=True)
    display_name = models.CharField(max_length=60, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    prefs = models.JSONField(default=dict, blank=True)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self):
        return self.email
```

`backend/accounts/apps.py`:
```python
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"
```

- [ ] **Step 5: Settings — AUTH_USER_MODEL + INSTALLED_APPS**

W `backend/obskura/settings.py`, w `INSTALLED_APPS` dodaj `"accounts"` w sekcji `# local` (PRZED `"core"` lub po — kolejność bez znaczenia, ale przed użyciem). Po bloku `INSTALLED_APPS` dodaj:
```python
AUTH_USER_MODEL = "accounts.User"
```
(umieść tuż po `INSTALLED_APPS`, przed `MIDDLEWARE`).

- [ ] **Step 6: Migracje**

Run:
```bash
docker compose run --rm web python manage.py makemigrations accounts
docker compose run --rm web python manage.py migrate
```
Expected: utworzona `accounts/migrations/0001_initial.py`, migracja zastosowana. **Przeczytaj wygenerowaną migrację** zanim ją zatwierdzisz (sanity check pól).

> Uwaga: `AUTH_USER_MODEL` ustawiamy w świeżej bazie (B0 nie miało własnego usera, tylko wbudowane tabele auth). Jeśli `migrate` zgłosi konflikt z istniejącym `auth.User`, zresetuj wolumen: `docker compose down -v && docker compose up -d` (B1 to nadal dev, brak danych do utraty), potem `migrate`.

- [ ] **Step 7: Run — expect PASS**

Run: `docker compose run --rm web pytest accounts/tests/test_models.py -v`
Expected: PASS (4 passed).

- [ ] **Step 8: Lint + commit**

```bash
docker compose run --rm web ruff check accounts/ && docker compose run --rm web ruff format --check accounts/
git add backend/accounts/ backend/obskura/settings.py
git commit -m "feat(accounts): custom User model with email login + UserManager (B1)"
```

---

## Task 2: Serializers (Register/Login/UserRead/MeUpdate/Prefs) — Zod mirror (TDD)

**Files:**
- Create: `backend/accounts/serializers.py`
- Create: `backend/accounts/tests/{factories.py,test_serializers.py}`

**Mirror źródłowy** (`src/lib/formSchemas.js`): `registerSchema` = email + password(min 8, ≥1 wielka litera, ≥1 cyfra) + name(min 2, max 60) + terms(===true). `loginSchema` = email + password(min 8).

- [ ] **Step 1: Factory + failing test**

`backend/accounts/tests/factories.py`:
```python
import factory
from django.contrib.auth import get_user_model

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    display_name = factory.Faker("name")

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        self.set_password(extracted or "Secret123")
        if create:
            self.save()
```

`backend/accounts/tests/test_serializers.py`:
```python
import pytest

from accounts.serializers import LoginSerializer, RegisterSerializer


@pytest.mark.django_db
def test_register_serializer_valid_creates_user():
    s = RegisterSerializer(data={
        "email": "new@example.com", "password": "Secret123",
        "name": "Nowy User", "terms": True,
    })
    assert s.is_valid(), s.errors
    user = s.save()
    assert user.email == "new@example.com"
    assert user.display_name == "Nowy User"
    assert user.check_password("Secret123")


@pytest.mark.parametrize("password", ["short1A", "nouppercase1", "NOLOWERORDIGIT"])
def test_register_serializer_rejects_weak_password(password):
    s = RegisterSerializer(data={
        "email": "x@example.com", "password": password,
        "name": "Ok Name", "terms": True,
    })
    assert not s.is_valid()
    assert "password" in s.errors


def test_register_serializer_requires_terms():
    s = RegisterSerializer(data={
        "email": "x@example.com", "password": "Secret123",
        "name": "Ok Name", "terms": False,
    })
    assert not s.is_valid()
    assert "terms" in s.errors


def test_login_serializer_validates_shape():
    assert LoginSerializer(data={"email": "x@example.com", "password": "Secret123"}).is_valid()
    assert not LoginSerializer(data={"email": "bad", "password": "x"}).is_valid()
```

> Uwaga: hasło `"NOLOWERORDIGIT"` nie ma cyfry → odrzucone; `"nouppercase1"` brak wielkiej litery → odrzucone; `"short1A"` ma 7 znaków → za krótkie.

- [ ] **Step 2: Run — expect FAIL**

Run: `docker compose run --rm web pytest accounts/tests/test_serializers.py -v`
Expected: ImportError (`accounts.serializers` nie istnieje).

- [ ] **Step 3: Serializers**

`backend/accounts/serializers.py`:
```python
import re

from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    """Lustro registerSchema (Zod). Pole `name` → User.display_name."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    name = serializers.CharField(min_length=2, max_length=60)
    terms = serializers.BooleanField()

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Konto z tym adresem e-mail już istnieje.")
        return value

    def validate_password(self, value):
        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError("Hasło musi zawierać wielką literę.")
        if not re.search(r"[0-9]", value):
            raise serializers.ValidationError("Hasło musi zawierać cyfrę.")
        return value

    def validate_terms(self, value):
        if value is not True:
            raise serializers.ValidationError("Wymagana akceptacja regulaminu.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            display_name=validated_data["name"],
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)


class UserReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "display_name", "prefs", "date_joined"]
        read_only_fields = fields


class MeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["display_name"]


class PrefsSerializer(serializers.Serializer):
    prefs = serializers.JSONField()

    def update(self, instance, validated_data):
        instance.prefs = validated_data["prefs"]
        instance.save(update_fields=["prefs"])
        return instance
```

- [ ] **Step 4: Run — expect PASS**

Run: `docker compose run --rm web pytest accounts/tests/test_serializers.py -v`
Expected: PASS (wszystkie, w tym 3 parametry weak-password).

- [ ] **Step 5: Lint + commit**

```bash
docker compose run --rm web ruff check accounts/ && docker compose run --rm web ruff format --check accounts/
git add backend/accounts/serializers.py backend/accounts/tests/factories.py backend/accounts/tests/test_serializers.py
git commit -m "feat(accounts): register/login/read serializers mirroring Zod schemas (B1)"
```

---

## Task 3: Auth endpoints — register + login + logout/logoutall (Knox) (TDD)

**Files:**
- Create (modify): `backend/accounts/views.py`
- Create: `backend/accounts/urls.py`
- Modify: `backend/obskura/urls.py` (include accounts.urls)
- Create: `backend/accounts/tests/test_auth.py`

- [ ] **Step 1: Failing test**

`backend/accounts/tests/test_auth.py`:
```python
import pytest
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory


@pytest.mark.django_db
def test_register_creates_user_and_returns_201():
    res = APIClient().post("/api/v1/auth/register", {
        "email": "reg@example.com", "password": "Secret123",
        "name": "Reg User", "terms": True,
    }, format="json")
    assert res.status_code == 201
    assert res.json()["user"]["email"] == "reg@example.com"


@pytest.mark.django_db
def test_register_duplicate_email_rejected():
    UserFactory(email="dup@example.com")
    res = APIClient().post("/api/v1/auth/register", {
        "email": "dup@example.com", "password": "Secret123",
        "name": "Dup User", "terms": True,
    }, format="json")
    assert res.status_code == 400
    assert "email" in res.json()


@pytest.mark.django_db
def test_login_returns_token():
    UserFactory(email="log@example.com", password="Secret123")
    res = APIClient().post("/api/v1/auth/login", {
        "email": "log@example.com", "password": "Secret123",
    }, format="json")
    assert res.status_code == 200
    assert "token" in res.json()
    assert res.json()["user"]["email"] == "log@example.com"


@pytest.mark.django_db
def test_login_wrong_password_401():
    UserFactory(email="log2@example.com", password="Secret123")
    res = APIClient().post("/api/v1/auth/login", {
        "email": "log2@example.com", "password": "WrongPass1",
    }, format="json")
    assert res.status_code == 401


@pytest.mark.django_db
def test_logout_invalidates_token():
    UserFactory(email="out@example.com", password="Secret123")
    client = APIClient()
    token = client.post("/api/v1/auth/login", {
        "email": "out@example.com", "password": "Secret123",
    }, format="json").json()["token"]
    client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
    assert client.post("/api/v1/auth/logout").status_code == 204
    # po wylogowaniu token nie działa na chronionym endpoincie
    assert client.get("/api/v1/accounts/me").status_code == 401
```

> `/accounts/me` powstaje w Task 4 — ostatnia asercja przejdzie dopiero po Task 4. Aby Task 3 był zielony samodzielnie, w Task 3 zakończ `test_logout_invalidates_token` na asercji `status_code == 204` i dopisz asercję `/me` w Task 4. (Implementer: w Task 3 usuń ostatnią linię z `/accounts/me`; dodasz ją w Task 4.)

- [ ] **Step 2: Run — expect FAIL**

Run: `docker compose run --rm web pytest accounts/tests/test_auth.py -v`
Expected: 404 (routy nie istnieją).

- [ ] **Step 3: Views**

`backend/accounts/views.py`:
```python
from django.contrib.auth import authenticate
from knox.models import AuthToken
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.serializers import (
    LoginSerializer,
    RegisterSerializer,
    UserReadSerializer,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        _, token = AuthToken.objects.create(user)
        return Response(
            {"user": UserReadSerializer(user).data, "token": token},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response(
                {"detail": "Nieprawidłowy e-mail lub hasło."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        _, token = AuthToken.objects.create(user)
        return Response({"user": UserReadSerializer(user).data, "token": token})
```

- [ ] **Step 4: URLs**

`backend/accounts/urls.py`:
```python
from django.urls import path
from knox.views import LogoutAllView, LogoutView

from accounts.views import LoginView, RegisterView

urlpatterns = [
    path("auth/register", RegisterView.as_view(), name="register"),
    path("auth/login", LoginView.as_view(), name="login"),
    path("auth/logout", LogoutView.as_view(), name="logout"),
    path("auth/logoutall", LogoutAllView.as_view(), name="logoutall"),
]
```

W `backend/obskura/urls.py` dodaj include accounts pod `api/v1/` (obok core):
```python
    path("api/v1/", include("core.urls")),
    path("api/v1/", include("accounts.urls")),
```

- [ ] **Step 5: Run — expect PASS**

Run: `docker compose run --rm web pytest accounts/tests/test_auth.py -v`
Expected: PASS (po usunięciu z testu ostatniej linii `/accounts/me` — patrz nota w Step 1).

- [ ] **Step 6: Lint + commit**

```bash
docker compose run --rm web ruff check accounts/ && docker compose run --rm web ruff format --check accounts/
git add backend/accounts/views.py backend/accounts/urls.py backend/obskura/urls.py backend/accounts/tests/test_auth.py
git commit -m "feat(accounts): register/login/logout endpoints with Knox tokens (B1)"
```

---

## Task 4: Accounts /me endpoints (read + update + prefs) (TDD)

**Files:**
- Modify: `backend/accounts/views.py` (MeView, MePrefsView)
- Modify: `backend/accounts/urls.py`
- Modify: `backend/accounts/tests/test_auth.py` (dopisz asercję `/me` w teście logout)
- Create: `backend/accounts/tests/test_accounts.py`

- [ ] **Step 1: Failing test**

`backend/accounts/tests/test_accounts.py`:
```python
import pytest
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory


def _auth_client(user):
    client = APIClient()
    _, token = AuthToken.objects.create(user)
    client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
    return client


@pytest.mark.django_db
def test_me_requires_auth():
    assert APIClient().get("/api/v1/accounts/me").status_code == 401


@pytest.mark.django_db
def test_me_returns_current_user():
    user = UserFactory(email="me@example.com", display_name="Me User")
    res = _auth_client(user).get("/api/v1/accounts/me")
    assert res.status_code == 200
    assert res.json()["email"] == "me@example.com"
    assert res.json()["display_name"] == "Me User"


@pytest.mark.django_db
def test_me_patch_updates_display_name():
    user = UserFactory(email="patch@example.com", display_name="Old")
    res = _auth_client(user).patch("/api/v1/accounts/me", {"display_name": "New"}, format="json")
    assert res.status_code == 200
    user.refresh_from_db()
    assert user.display_name == "New"


@pytest.mark.django_db
def test_me_prefs_put_replaces_prefs():
    user = UserFactory(email="prefs@example.com")
    res = _auth_client(user).put(
        "/api/v1/accounts/me/prefs", {"prefs": {"theme": "dark", "lang": "pl"}}, format="json"
    )
    assert res.status_code == 200
    user.refresh_from_db()
    assert user.prefs == {"theme": "dark", "lang": "pl"}
```

Dopisz na końcu `test_logout_invalidates_token` (test_auth.py) usuniętą wcześniej linię:
```python
    assert client.get("/api/v1/accounts/me").status_code == 401
```

- [ ] **Step 2: Run — expect FAIL**

Run: `docker compose run --rm web pytest accounts/tests/test_accounts.py -v`
Expected: 404.

- [ ] **Step 3: Views (dopisz do accounts/views.py)**

Dodaj importy i klasy:
```python
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated

from accounts.serializers import MeUpdateSerializer, PrefsSerializer


class MeView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return MeUpdateSerializer
        return UserReadSerializer


class MePrefsView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = PrefsSerializer(instance=request.user, data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserReadSerializer(user).data)
```

- [ ] **Step 4: URLs (dopisz do accounts/urls.py)**

```python
from accounts.views import LoginView, MePrefsView, MeView, RegisterView
...
    path("accounts/me", MeView.as_view(), name="me"),
    path("accounts/me/prefs", MePrefsView.as_view(), name="me-prefs"),
```

- [ ] **Step 5: Run — expect PASS**

Run: `docker compose run --rm web pytest accounts/tests/ -v`
Expected: wszystkie testy accounts zielone (models + serializers + auth + accounts).

- [ ] **Step 6: Lint + commit**

```bash
docker compose run --rm web ruff check accounts/ && docker compose run --rm web ruff format --check accounts/
git add backend/accounts/views.py backend/accounts/urls.py backend/accounts/tests/
git commit -m "feat(accounts): /accounts/me read+update and prefs endpoints (B1)"
```

---

## Task 5: Throttling (scoped register/login) + tests

**Files:**
- Modify: `backend/obskura/settings.py` (`DEFAULT_THROTTLE_RATES`)
- Create: `backend/accounts/tests/test_throttling.py`

- [ ] **Step 1: Settings — dodaj scope rates**

W `backend/obskura/settings.py`, w `REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]`, dodaj klucze `register` i `login` (zachowaj istniejące `anon`/`user`):
```python
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/min",
        "user": "1000/day",
        "register": "10/hour",
        "login": "10/min",
    },
```

- [ ] **Step 2: Failing test**

`backend/accounts/tests/test_throttling.py`:
```python
import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_login_throttled_after_limit(settings):
    settings.REST_FRAMEWORK = {
        **settings.REST_FRAMEWORK,
        "DEFAULT_THROTTLE_RATES": {**settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"], "login": "3/min"},
    }
    from django.core.cache import cache
    cache.clear()
    client = APIClient()
    payload = {"email": "nobody@example.com", "password": "WrongPass1"}
    codes = [client.post("/api/v1/auth/login", payload, format="json").status_code for _ in range(5)]
    assert 429 in codes  # po przekroczeniu limitu pojawia się Too Many Requests
```

> Uwaga: throttle DRF czyta rate przy inicjalizacji klasy z `settings`. Override `settings.REST_FRAMEWORK` + `cache.clear()` izoluje test. Jeśli rate nie odświeża się przy override, alternatywa: bez override, 11 żądań przy `login: 10/min` — ale to wolniejsze i kruche; preferuj override.

- [ ] **Step 3: Run — expect FAIL→PASS**

Run: `docker compose run --rm web pytest accounts/tests/test_throttling.py -v`
- Najpierw uruchom PRZED zmianą rate w teście, by zobaczyć brak 429 (lub od razu po dodaniu rates w Step 1). Po implementacji (rates w settings + ScopedRateThrottle już na widokach z Task 3): PASS.

> ScopedRateThrottle jest już ustawiony na `LoginView`/`RegisterView` w Task 3 (`throttle_scope`). Ten task tylko dokłada **rates** w settings + test. Jeśli test 429 nie przechodzi, zweryfikuj że `throttle_classes=[ScopedRateThrottle]` i `throttle_scope` są na widokach.

- [ ] **Step 4: Lint + commit**

```bash
docker compose run --rm web ruff check accounts/ && docker compose run --rm web ruff format --check accounts/ backend/obskura/settings.py
git add backend/obskura/settings.py backend/accounts/tests/test_throttling.py
git commit -m "feat(accounts): scoped throttling for register/login (B1)"
```

---

## Task 6: Admin + final verification

**Files:**
- Create: `backend/accounts/admin.py`

- [ ] **Step 1: Admin**

`backend/accounts/admin.py`:
```python
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
        ("Uprawnienia", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Daty", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "password1", "password2")}),
    )
    readonly_fields = ["date_joined", "last_login"]
```

- [ ] **Step 2: Verify — admin check + full suite**

Run:
```bash
docker compose run --rm web python manage.py check
docker compose run --rm web ruff check .
docker compose run --rm web ruff format --check .
docker compose run --rm web pytest
```
Expected: `check` 0 issues; ruff clean; pytest wszystkie zielone (B0 8 + B1 nowe).

- [ ] **Step 3: Smoke (opcjonalny, pełny stack)**

```bash
docker compose up -d && docker compose exec web python manage.py migrate
# rejestracja
curl -s -X POST http://localhost:8000/api/v1/auth/register -H "Content-Type: application/json" \
  -d '{"email":"smoke@example.com","password":"Secret123","name":"Smoke","terms":true}'
docker compose down
```
Expected: JSON z `user` + `token`, status 201.

- [ ] **Step 4: Commit**

```bash
git add backend/accounts/admin.py
git commit -m "feat(accounts): Django admin for custom User (B1)"
```

---

## Definition of Done (B1)

- [ ] `accounts.User` (email login) + `AUTH_USER_MODEL` ustawione, migracje zastosowane.
- [ ] `POST /api/v1/auth/register` (201 + token), `/auth/login` (200 + token), `/auth/logout` (204), `/auth/logoutall`.
- [ ] `GET/PATCH /api/v1/accounts/me`, `PUT /api/v1/accounts/me/prefs` — chronione (401 bez tokenu).
- [ ] Walidacja serializerów = lustro `formSchemas` (email, password min8+wielka+cyfra, name, terms).
- [ ] Throttling scoped na register/login (429 po limicie).
- [ ] Admin dla User.
- [ ] `manage.py check` 0 issues; ruff clean; cały `pytest` zielony.
- [ ] Commity po angielsku, bez `Co-Authored-By`.

**Następna faza:** B2 — Catalog (Season/Genre/Creator/Episode, filtry, cursor-pagination, cache, indeksy, seed). Tam: behawioralne testy `SoftDeleteModel` na czystym modelu katalogu.

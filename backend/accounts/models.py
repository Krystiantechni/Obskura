from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from accounts.managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """Użytkownik z logowaniem emailem. prefs (JSONB) trzyma ustawienia onboardingu."""

    email = models.EmailField(unique=True)  # unique tworzy już indeks
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
        verbose_name = "użytkownik"
        verbose_name_plural = "użytkownicy"

    def __str__(self):
        return self.email

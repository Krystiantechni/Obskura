from django.urls import path
from knox.views import LogoutAllView, LogoutView

from accounts.views import LoginView, MePrefsView, MeView, RegisterView

urlpatterns = [
    path("auth/register", RegisterView.as_view(), name="register"),
    path("auth/login", LoginView.as_view(), name="login"),
    path("auth/logout", LogoutView.as_view(), name="logout"),
    path("auth/logoutall", LogoutAllView.as_view(), name="logoutall"),
    path("accounts/me", MeView.as_view(), name="me"),
    path("accounts/me/prefs", MePrefsView.as_view(), name="me-prefs"),
]

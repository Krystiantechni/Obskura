from django.urls import path
from knox.views import LogoutAllView, LogoutView

from accounts.views import LoginView, RegisterView

urlpatterns = [
    path("auth/register", RegisterView.as_view(), name="register"),
    path("auth/login", LoginView.as_view(), name="login"),
    path("auth/logout", LogoutView.as_view(), name="logout"),
    path("auth/logoutall", LogoutAllView.as_view(), name="logoutall"),
]

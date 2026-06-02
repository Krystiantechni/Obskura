from django.urls import path

from events.views import (
    CancelRegistrationView,
    EventDetailView,
    EventListView,
    RegisterView,
    RegistrationsView,
)

urlpatterns = [
    # Static paths first to avoid slug capture conflicts
    path("events/registrations", RegistrationsView.as_view()),
    path("events", EventListView.as_view()),
    path("events/<slug:slug>", EventDetailView.as_view()),
    path("events/<slug:slug>/register", RegisterView.as_view()),
    path("events/<slug:slug>/cancel", CancelRegistrationView.as_view()),
]

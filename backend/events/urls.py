from django.urls import path

from events.views import EventDetailView, EventListView

urlpatterns = [
    path("events", EventListView.as_view()),
    path("events/<slug:slug>", EventDetailView.as_view()),
]

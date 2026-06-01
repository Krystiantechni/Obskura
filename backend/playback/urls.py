from django.urls import path

from playback.views import HistoryView, ProgressView

urlpatterns = [
    path("playback/progress/<slug:episode_slug>", ProgressView.as_view(), name="progress"),
    path("playback/history", HistoryView.as_view(), name="history"),
]

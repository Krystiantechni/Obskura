from django.urls import path

from playback.views import (
    FavoriteDestroyView,
    FavoriteListCreateView,
    HistoryView,
    ProgressView,
    QueueDestroyView,
    QueueListCreateView,
)

urlpatterns = [
    path("playback/progress/<slug:episode_slug>", ProgressView.as_view(), name="progress"),
    path("playback/history", HistoryView.as_view(), name="history"),
    path("playback/favorites", FavoriteListCreateView.as_view(), name="favorites"),
    path(
        "playback/favorites/<slug:episode_slug>",
        FavoriteDestroyView.as_view(),
        name="favorites-destroy",
    ),
    path("playback/queue", QueueListCreateView.as_view(), name="queue"),
    path("playback/queue/<int:pk>", QueueDestroyView.as_view(), name="queue-destroy"),
]

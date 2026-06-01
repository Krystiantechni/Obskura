from django.urls import path

from community.views import (
    CategoriesView,
    PostCreateView,
    ThreadDetailView,
    ThreadListCreateView,
)

urlpatterns = [
    path("community/categories", CategoriesView.as_view(), name="community-categories"),
    path("community/threads", ThreadListCreateView.as_view(), name="community-threads"),
    path(
        "community/threads/<slug:slug>",
        ThreadDetailView.as_view(),
        name="community-thread-detail",
    ),
    path(
        "community/threads/<slug:slug>/posts",
        PostCreateView.as_view(),
        name="community-thread-posts",
    ),
]

from django.urls import path

from community import views

urlpatterns = [
    path("community/categories", views.CategoriesView.as_view(), name="community-categories"),
    path("community/threads", views.ThreadListCreateView.as_view(), name="community-threads"),
    path(
        "community/threads/<slug:slug>",
        views.ThreadDetailView.as_view(),
        name="community-thread-detail",
    ),
    path(
        "community/threads/<slug:slug>/posts",
        views.PostCreateView.as_view(),
        name="community-thread-posts",
    ),
    path(
        "community/threads/<slug:slug>/flag",
        views.ThreadFlagView.as_view(),
        name="community-thread-flag",
    ),
    path("community/posts/<int:pk>/reactions", views.ReactionView.as_view(), name="reaction"),
    path(
        "community/posts/<int:pk>/report",
        views.ReportView.as_view(),
        name="community-post-report",
    ),
    path(
        "community/posts/<int:pk>/moderate",
        views.ModeratePostView.as_view(),
        name="community-post-moderate",
    ),
    path(
        "community/moderation/queue",
        views.ModerationQueueView.as_view(),
        name="community-moderation-queue",
    ),
    path("community/reports", views.ReportsView.as_view(), name="community-reports"),
    path(
        "community/reports/<int:pk>/resolve",
        views.ResolveReportView.as_view(),
        name="community-report-resolve",
    ),
]

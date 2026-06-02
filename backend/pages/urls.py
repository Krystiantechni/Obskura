from django.urls import path

from pages.views import LegalDetailView, LegalListView, PressView

urlpatterns = [
    path("pages/legal", LegalListView.as_view(), name="pages-legal-list"),
    path("pages/legal/<slug:kind>", LegalDetailView.as_view(), name="pages-legal-detail"),
    path("pages/press", PressView.as_view(), name="pages-press"),
]

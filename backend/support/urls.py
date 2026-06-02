from django.urls import path

from support.views import FaqView

urlpatterns = [
    path("support/faq", FaqView.as_view(), name="support-faq"),
]

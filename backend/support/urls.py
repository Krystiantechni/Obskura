from django.urls import path

from support.views import FaqView, TicketCreateView

urlpatterns = [
    path("support/faq", FaqView.as_view(), name="support-faq"),
    path("support/tickets", TicketCreateView.as_view(), name="support-tickets"),
]

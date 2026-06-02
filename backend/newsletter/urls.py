from django.urls import path

from newsletter.views import MailingsView, SubscribeView, UnsubscribeView

urlpatterns = [
    path("newsletter/subscribe", SubscribeView.as_view(), name="newsletter-subscribe"),
    path("newsletter/unsubscribe", UnsubscribeView.as_view(), name="newsletter-unsubscribe"),
    path("mailings", MailingsView.as_view(), name="newsletter-mailings"),
]

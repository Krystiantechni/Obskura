from django.urls import path
from rest_framework.routers import DefaultRouter

from membership.views import (
    CancelSubscriptionView,
    PatronTierViewSet,
    PlanViewSet,
    StripeWebhookView,
    SubscribeView,
    SubscriptionView,
)

router = DefaultRouter(trailing_slash=False)
router.register("membership/plans", PlanViewSet, basename="plan")
router.register("membership/patron-tiers", PatronTierViewSet, basename="patron-tier")

urlpatterns = router.urls + [
    path("membership/subscribe", SubscribeView.as_view(), name="membership-subscribe"),
    path(
        "membership/subscription",
        SubscriptionView.as_view(),
        name="membership-subscription",
    ),
    path(
        "membership/subscription/cancel",
        CancelSubscriptionView.as_view(),
        name="membership-subscription-cancel",
    ),
    path(
        "membership/stripe/webhook",
        StripeWebhookView.as_view(),
        name="membership-stripe-webhook",
    ),
]

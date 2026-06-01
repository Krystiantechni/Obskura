from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from core.authentication import OptionalTokenAuthentication
from membership import payments, selectors, services
from membership.models import Plan
from membership.selectors import active_subscription
from membership.serializers import (
    PatronTierSerializer,
    PlanSerializer,
    SubscribeWriteSerializer,
    SubscriptionReadSerializer,
)


class PlanViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes = [OptionalTokenAuthentication]
    pagination_class = None
    serializer_class = PlanSerializer

    def get_queryset(self):
        return selectors.plans()

    def list(self, request, *args, **kwargs):
        return Response(PlanSerializer(selectors.plans_cached(), many=True).data)


class PatronTierViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes = [OptionalTokenAuthentication]
    pagination_class = None
    serializer_class = PatronTierSerializer

    def get_queryset(self):
        return selectors.patron_tiers(season=self._season_param())

    def _season_param(self):
        raw = self.request.query_params.get("season")
        if raw is None or raw == "":
            return None
        try:
            return int(raw)
        except (TypeError, ValueError):
            return None

    def list(self, request, *args, **kwargs):
        season = self._season_param()
        data = PatronTierSerializer(selectors.patron_tiers_cached(season=season), many=True).data
        return Response(data)


class SubscribeView(APIView):
    """POST /membership/subscribe — free → active, płatny → checkout_url."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SubscribeWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan = get_object_or_404(
            Plan.objects.filter(is_active=True),
            code=serializer.validated_data["plan_code"],
        )
        result = services.subscribe(
            user=request.user,
            plan=plan,
            billing_period=serializer.validated_data["billing_period"],
        )
        return Response(result, status=status.HTTP_200_OK)


class SubscriptionView(APIView):
    """GET /membership/subscription — bieżąca żywa subskrypcja lub {subscription: null}."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        sub = active_subscription(user=request.user)
        if sub is None:
            return Response({"subscription": None})
        return Response(SubscriptionReadSerializer(sub).data)


class CancelSubscriptionView(APIView):
    """POST /membership/subscription/cancel — cancel at period end."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        sub = services.cancel_subscription(user=request.user)
        if sub is None:
            return Response(
                {"detail": "Brak aktywnej subskrypcji do anulowania."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(SubscriptionReadSerializer(sub).data)


class StripeWebhookView(APIView):
    """POST /membership/stripe/webhook — open endpoint, podpis weryfikowany przez Stripe."""

    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes: list = []

    def post(self, request):
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")
        try:
            event = payments.construct_event(payload=request.body, sig_header=sig_header)
        except Exception:
            return Response(
                {"detail": "Nieprawidłowy podpis webhooka."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        services.handle_webhook_event(event=event)
        return Response(status=status.HTTP_200_OK)

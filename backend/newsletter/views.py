from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from newsletter import selectors, services
from newsletter.serializers import (
    SubscribeWriteSerializer,
    UnsubscribeSerializer,
)


class SubscribeView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "newsletter"

    def post(self, request):
        s = SubscribeWriteSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        services.subscribe(**s.validated_data)
        return Response({"detail": "Zapis potwierdzony."}, status=status.HTTP_201_CREATED)


class UnsubscribeView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def post(self, request):
        s = UnsubscribeSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        found = services.unsubscribe(
            token=s.validated_data.get("token") or None,
            email=s.validated_data.get("email") or None,
        )
        if not found:
            return Response(
                {"detail": "Nie znaleziono subskrybenta."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({"detail": "Wypisano pomyslnie."}, status=status.HTTP_200_OK)


class MailingsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        data = selectors.campaigns_cached()
        return Response(data)

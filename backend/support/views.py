from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from support import selectors, services
from support.serializers import TicketWriteSerializer


class FaqView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        category = request.query_params.get("category") or None
        # faq_cached returns plain dicts (pre-serialized, pickle-safe)
        data = selectors.faq_cached(category=category)
        return Response(data)


class TicketCreateView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"

    def post(self, request):
        s = TicketWriteSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        services.create_ticket(**s.validated_data)
        return Response({"detail": "Zgłoszenie przyjęte."}, status=status.HTTP_201_CREATED)

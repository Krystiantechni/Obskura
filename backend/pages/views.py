from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from pages import selectors
from pages.models import LegalKind
from pages.serializers import LegalDocSerializer, PressItemSerializer


class LegalListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        docs = selectors.current_legal_cached()
        serializer = LegalDocSerializer(docs, many=True)
        return Response(serializer.data)


class LegalDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, kind):
        # Validate kind is a known LegalKind value
        valid_kinds = {c[0] for c in LegalKind.choices}
        if kind not in valid_kinds:
            return Response({"detail": "Not found."}, status=404)
        doc = selectors.legal_by_kind_cached(kind=kind)
        if doc is None:
            return Response({"detail": "Not found."}, status=404)
        serializer = LegalDocSerializer(doc)
        return Response(serializer.data)


class PressView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        items = selectors.press_items_cached()
        serializer = PressItemSerializer(items, many=True)
        return Response(serializer.data)

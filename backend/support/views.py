from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from support import selectors


class FaqView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        category = request.query_params.get("category") or None
        # faq_cached returns plain dicts (pre-serialized, pickle-safe)
        data = selectors.faq_cached(category=category)
        return Response(data)

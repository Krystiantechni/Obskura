from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet

from core.authentication import OptionalTokenAuthentication
from membership import selectors
from membership.serializers import PatronTierSerializer, PlanSerializer


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

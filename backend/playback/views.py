from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Episode
from core.pagination import DefaultCursorPagination
from playback.selectors import history
from playback.serializers import ProgressReadSerializer, ProgressWriteSerializer
from playback.services import upsert_progress


class HistoryCursorPagination(DefaultCursorPagination):
    ordering = "-updated_at"


class ProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, episode_slug):
        episode = get_object_or_404(Episode, slug=episode_slug)
        progress = get_object_or_404(
            request.user.progress.select_related("episode", "episode__season", "episode__genre"),
            episode=episode,
        )
        return Response(ProgressReadSerializer(progress).data)

    def put(self, request, episode_slug):
        episode = get_object_or_404(Episode, slug=episode_slug)
        serializer = ProgressWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        progress, created = upsert_progress(
            user=request.user,
            episode=episode,
            position_s=serializer.validated_data["position_s"],
            completed=serializer.validated_data.get("completed", False),
        )
        if created:
            # plays_count zinkrementowane przez UPDATE — odśwież nieaktualną wartość
            progress.episode.refresh_from_db()
        return Response(ProgressReadSerializer(progress).data)


class HistoryView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProgressReadSerializer
    pagination_class = HistoryCursorPagination

    def get_queryset(self):
        return history(user=self.request.user)

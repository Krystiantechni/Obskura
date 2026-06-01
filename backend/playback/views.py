from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Episode
from core.pagination import DefaultCursorPagination, DefaultPageNumberPagination
from playback.models import Favorite, QueueItem
from playback.selectors import favorites, history, queue_items
from playback.serializers import (
    FavoriteSerializer,
    FavoriteWriteSerializer,
    ProgressReadSerializer,
    ProgressWriteSerializer,
    QueueItemSerializer,
    QueueWriteSerializer,
)
from playback.services import upsert_progress


class HistoryCursorPagination(DefaultCursorPagination):
    ordering = "-updated_at"


class FavoriteCursorPagination(DefaultCursorPagination):
    # DefaultCursorPagination already orders by -created_at, which is correct for favorites.
    pass


class QueuePageNumberPagination(DefaultPageNumberPagination):
    pass


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


class FavoriteListCreateView(APIView):
    """GET /playback/favorites — list; POST /playback/favorites — add (idempotent)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = favorites(user=request.user)
        paginator = FavoriteCursorPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = FavoriteSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = FavoriteWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        episode = get_object_or_404(
            Episode.objects.filter(is_deleted=False), slug=serializer.validated_data["episode_slug"]
        )
        fav, created = Favorite.objects.get_or_create(user=request.user, episode=episode)
        code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(FavoriteSerializer(fav).data, status=code)


class FavoriteDestroyView(APIView):
    """DELETE /playback/favorites/<episode_slug>."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, episode_slug):
        Favorite.objects.filter(user=request.user, episode__slug=episode_slug).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class QueueListCreateView(APIView):
    """GET /playback/queue (list) or POST /playback/queue (add/update, idempotent per user+ep)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = queue_items(user=request.user).order_by("position")
        paginator = QueuePageNumberPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = QueueItemSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = QueueWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        episode = get_object_or_404(
            Episode.objects.filter(is_deleted=False), slug=serializer.validated_data["episode_slug"]
        )
        item, created = QueueItem.objects.update_or_create(
            user=request.user,
            episode=episode,
            defaults={"position": serializer.validated_data["position"]},
        )
        code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(QueueItemSerializer(item).data, status=code)


class QueueDestroyView(APIView):
    """DELETE /playback/queue/<pk> — only owner can delete (404 for other users' items)."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        item = get_object_or_404(QueueItem.objects.filter(user=request.user), pk=pk)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

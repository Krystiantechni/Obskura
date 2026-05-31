from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny
from rest_framework.viewsets import ReadOnlyModelViewSet

from catalog import selectors
from catalog.filters import EpisodeFilter
from catalog.pagination import EpisodeCursorPagination
from catalog.serializers import (
    CreatorSerializer,
    EpisodeDetailSerializer,
    EpisodeListSerializer,
    GenreSerializer,
    SeasonSerializer,
)
from core.pagination import DefaultPageNumberPagination


class EpisodeViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    lookup_field = "slug"
    pagination_class = EpisodeCursorPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_class = EpisodeFilter
    ordering_fields = ["published_at", "rating_avg", "plays_count", "number"]
    ordering = ["-published_at"]
    search_fields = ["title", "title_em"]

    def get_queryset(self):
        return selectors.episodes_list()

    def get_serializer_class(self):
        return EpisodeDetailSerializer if self.action == "retrieve" else EpisodeListSerializer


class SeasonViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    lookup_field = "slug"
    pagination_class = DefaultPageNumberPagination
    serializer_class = SeasonSerializer

    def get_queryset(self):
        return selectors.seasons_list()


class GenreViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    lookup_field = "slug"
    pagination_class = DefaultPageNumberPagination
    serializer_class = GenreSerializer

    def get_queryset(self):
        return selectors.genres_list()


class CreatorViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    lookup_field = "slug"
    pagination_class = DefaultPageNumberPagination
    serializer_class = CreatorSerializer

    def get_queryset(self):
        role = self.request.query_params.get("role")
        return selectors.creators_list(role=role)

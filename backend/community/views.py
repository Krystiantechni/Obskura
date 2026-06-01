from django.db.models import F
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Episode
from community import selectors, services
from community.models import Category, Thread
from community.pagination import PostCursorPagination, ThreadCursorPagination
from community.serializers import (
    CategorySerializer,
    PostCreateSerializer,
    PostSerializer,
    ThreadCreateSerializer,
    ThreadDetailSerializer,
    ThreadListSerializer,
)
from core.authentication import OptionalTokenAuthentication


class CategoriesView(APIView):
    """GET /community/categories — publiczna, cache'owana lista (bez paginacji)."""

    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        data = CategorySerializer(selectors.categories_cached(), many=True).data
        return Response(data)


class ThreadListCreateView(APIView):
    """GET list (publiczny, viewer-aware). POST create wymaga auth."""

    permission_classes = [AllowAny]
    authentication_classes = [OptionalTokenAuthentication]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        qs = selectors.threads(
            viewer=request.user,
            category=request.query_params.get("category"),
            episode=request.query_params.get("episode"),
        )
        paginator = ThreadCursorPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = ThreadListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = ThreadCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = get_object_or_404(
            Category.objects.filter(is_active=True),
            slug=serializer.validated_data["category_slug"],
        )
        episode = None
        episode_slug = serializer.validated_data.get("episode_slug")
        if episode_slug:
            episode = get_object_or_404(Episode.objects.filter(is_deleted=False), slug=episode_slug)
        thread = services.create_thread(
            user=request.user,
            category=category,
            title=serializer.validated_data["title"],
            body=serializer.validated_data["body"],
            episode=episode,
        )
        return Response(ThreadDetailSerializer(thread).data, status=status.HTTP_201_CREATED)


class ThreadDetailView(APIView):
    """GET /community/threads/{slug} — wątek + paginowane posty; bump views_count."""

    permission_classes = [AllowAny]
    authentication_classes = [OptionalTokenAuthentication]

    def get(self, request, slug):
        thread = selectors.thread_detail(viewer=request.user, slug=slug)
        if thread is None:
            raise NotFound("Nie znaleziono wątku.")
        # Write-on-read: akceptowany licznik bez dedupu (spec §8). F() = atomowo.
        selectors.Thread.all_objects.filter(pk=thread.pk).update(views_count=F("views_count") + 1)
        thread.views_count += 1

        posts_qs = selectors.visible_posts(viewer=request.user, thread=thread)
        paginator = PostCursorPagination()
        page = paginator.paginate_queryset(posts_qs, request, view=self)
        posts_payload = paginator.get_paginated_response(PostSerializer(page, many=True).data).data
        return Response(
            {
                "thread": ThreadDetailSerializer(thread).data,
                "posts": posts_payload,
            }
        )


class PostCreateView(APIView):
    """POST /community/threads/<slug>/posts — odpowiedź w wątku."""

    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        thread = get_object_or_404(Thread.objects.select_related("category"), slug=slug)
        serializer = PostCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = services.create_post(
            user=request.user,
            thread=thread,
            body=serializer.validated_data["body"],
        )
        return Response(PostSerializer(post).data, status=status.HTTP_201_CREATED)

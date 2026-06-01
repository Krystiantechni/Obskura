from django.db.models import F
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from community import selectors
from community.pagination import PostCursorPagination, ThreadCursorPagination
from community.serializers import (
    CategorySerializer,
    PostSerializer,
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
    """GET list (publiczny, viewer-aware). POST create dochodzi w B5a-4."""

    permission_classes = [AllowAny]
    authentication_classes = [OptionalTokenAuthentication]

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

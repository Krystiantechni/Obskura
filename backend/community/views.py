from django.db.models import F
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Episode
from community import selectors, services
from community.models import Category, Post, Report, Thread
from community.pagination import PostCursorPagination, ThreadCursorPagination
from community.permissions import IsModerator
from community.selectors import post_visible_to
from community.serializers import (
    CategorySerializer,
    ModerateSerializer,
    PostCreateSerializer,
    PostSerializer,
    ReactionWriteSerializer,
    ReportWriteSerializer,
    ResolveReportSerializer,
    ThreadCreateSerializer,
    ThreadDetailSerializer,
    ThreadFlagSerializer,
    ThreadListSerializer,
)
from community.services import toggle_reaction
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


class ReactionView(APIView):
    """POST community/posts/<int:pk>/reactions — toggle the caller's reaction.

    Reagować można tylko na posty widoczne dla użytkownika (PUBLISHED lub własne).
    Niewidoczne/usunięte → 404 (nie ujawniamy istnienia ukrytych postów).
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post.all_objects, pk=pk)
        if not post_visible_to(viewer=request.user, post=post):
            raise Http404
        serializer = ReactionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = toggle_reaction(
            user=request.user,
            post=post,
            kind=serializer.validated_data["kind"],
        )
        post.refresh_from_db(fields=["reaction_count", "reactions_breakdown"])
        return Response(
            {
                "reacted": result["reacted"],
                "reaction_count": post.reaction_count,
                "reactions_breakdown": post.reactions_breakdown,
            }
        )


class ReportView(APIView):
    """POST /community/posts/<pk>/report — user flags a post."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post.all_objects, pk=pk)
        serializer = ReportWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        existed = Report.objects.filter(reporter=request.user, post=post).exists()
        report = services.report_post(
            user=request.user,
            post=post,
            reason=serializer.validated_data["reason"],
            detail=serializer.validated_data.get("detail", ""),
        )
        code = status.HTTP_200_OK if existed else status.HTTP_201_CREATED
        return Response(
            {"id": report.pk, "status": report.status, "reason": report.reason},
            status=code,
        )


class ModerationQueueView(APIView):
    """GET /community/moderation/queue — pending + flagged posts (moderator only)."""

    permission_classes = [IsModerator]

    def get(self, request):
        qs = selectors.moderation_queue()
        paginator = PostCursorPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = PostSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class ModeratePostView(APIView):
    """POST /community/posts/<pk>/moderate — approve/reject/remove/restore."""

    permission_classes = [IsModerator]

    def post(self, request, pk):
        post = get_object_or_404(Post.all_objects, pk=pk)
        serializer = ModerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = services.moderate_post(
            moderator=request.user,
            post=post,
            action=serializer.validated_data["action"],
            reason=serializer.validated_data.get("reason", ""),
        )
        return Response(PostSerializer(post).data, status=status.HTTP_200_OK)


class ThreadFlagView(APIView):
    """POST /community/threads/<slug>/flag — pin/unpin/lock/unlock."""

    permission_classes = [IsModerator]

    def post(self, request, slug):
        thread = get_object_or_404(Thread.all_objects, slug=slug)
        serializer = ThreadFlagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        thread = services.set_thread_flag(
            moderator=request.user,
            thread=thread,
            action=serializer.validated_data["action"],
        )
        return Response(
            {
                "slug": thread.slug,
                "is_pinned": thread.is_pinned,
                "is_locked": thread.is_locked,
            },
            status=status.HTTP_200_OK,
        )


class ReportsView(APIView):
    """GET /community/reports — open reports (moderator only)."""

    permission_classes = [IsModerator]

    def get(self, request):
        qs = selectors.open_reports()
        paginator = PostCursorPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        data = [
            {
                "id": r.pk,
                "post_id": r.post_id,
                "reason": r.reason,
                "detail": r.detail,
                "status": r.status,
                "created_at": r.created_at,
            }
            for r in page
        ]
        return paginator.get_paginated_response(data)


class ResolveReportView(APIView):
    """POST /community/reports/<pk>/resolve — resolved/dismissed + handled_by."""

    permission_classes = [IsModerator]

    def post(self, request, pk):
        report = get_object_or_404(Report, pk=pk)
        serializer = ResolveReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = services.resolve_report(
            moderator=request.user,
            report=report,
            status=serializer.validated_data["status"],
            resolution=serializer.validated_data.get("resolution", ""),
        )
        return Response(
            {
                "id": report.pk,
                "status": report.status,
                "handled_by": report.handled_by_id,
                "resolution": report.resolution,
            },
            status=status.HTTP_200_OK,
        )

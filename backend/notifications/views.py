from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications import selectors
from notifications.models import Notification, StreamStatus
from notifications.pagination import NotificationCursorPagination
from notifications.serializers import NotificationSerializer, StreamStatusSerializer


class NotificationListView(APIView):
    """GET /notifications — cursor-paginated list of own notifications."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = selectors.user_notifications(user=request.user)
        paginator = NotificationCursorPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = NotificationSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class UnreadCountView(APIView):
    """GET /notifications/unread-count — returns {"unread": n}."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = selectors.unread_count(user=request.user)
        return Response({"unread": count})


class MarkReadView(APIView):
    """POST /notifications/<pk>/read — mark single notification as read."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk, user=request.user)
        if notification.read_at is None:
            notification.read_at = timezone.now()
            notification.save(update_fields=["read_at"])
        return Response(NotificationSerializer(notification).data)


class MarkAllReadView(APIView):
    """POST /notifications/read-all — mark all own unread notifications as read."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(
            user=request.user,
            read_at__isnull=True,
        ).update(read_at=timezone.now())
        return Response({"updated": updated})


class StreamStatusView(APIView):
    """GET /stream/status — public endpoint returning current StreamStatus singleton."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        status = StreamStatus.load()
        return Response(StreamStatusSerializer(status).data)

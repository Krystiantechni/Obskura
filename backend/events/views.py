from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.authentication import OptionalTokenAuthentication
from events.models import Event, EventMode, EventStatus
from events.pagination import (
    EventCursorPagination,
    PastEventCursorPagination,
    RegistrationCursorPagination,
)
from events.selectors import event_detail, events_list, events_list_cached, user_registrations
from events.serializers import (
    EventDetailSerializer,
    EventListSerializer,
    RegistrationReadSerializer,
)
from events.services import cancel_registration, register_for_event

_VALID_MODES = {m.value for m in EventMode}
_VALID_WHEN = {"upcoming", "past"}


class EventListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [OptionalTokenAuthentication]

    def get(self, request):
        mode = request.query_params.get("mode") or None
        when = request.query_params.get("when") or None

        if mode is not None and mode not in _VALID_MODES:
            raise ValidationError({"mode": f"Invalid mode. Choose from: {sorted(_VALID_MODES)}."})
        if when is not None and when not in _VALID_WHEN:
            raise ValidationError({"when": "Invalid when. Choose from: upcoming, past."})

        # Try cache first (returns a list when hot).
        cached = events_list_cached(when=when, mode=mode)

        if when == "past":
            paginator = PastEventCursorPagination()
        else:
            paginator = EventCursorPagination()

        # CursorPagination requires a queryset; if cache returned a list we paginate in-memory
        # by falling back to the live queryset (still N+1-free via select_related).
        if isinstance(cached, list):
            # Cache hot: paginate the list by converting back to an ordered queryset
            qs = events_list(when=when, mode=mode)
        else:
            qs = cached

        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            serializer = EventListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = EventListSerializer(qs, many=True)
        return Response(serializer.data)


class EventDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [OptionalTokenAuthentication]

    def get(self, request, slug):
        event = event_detail(slug=slug)
        if event is None:
            raise NotFound()
        serializer = EventDetailSerializer(event, context={"request": request})
        return Response(serializer.data)


class RegisterView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        from django.shortcuts import get_object_or_404

        event = get_object_or_404(Event.objects, slug=slug, status=EventStatus.PUBLISHED)
        result = register_for_event(user=request.user, event=event)
        return Response(result, status=201)


class CancelRegistrationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        from django.shortcuts import get_object_or_404

        event = get_object_or_404(Event.objects, slug=slug, status=EventStatus.PUBLISHED)
        cancel_registration(user=request.user, event=event)
        return Response({"detail": "ok"}, status=200)


class RegistrationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = user_registrations(user=request.user)
        paginator = RegistrationCursorPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            serializer = RegistrationReadSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        serializer = RegistrationReadSerializer(qs, many=True)
        return Response(serializer.data)

from django.contrib.auth import authenticate
from knox.models import AuthToken
from rest_framework import status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.serializers import (
    LoginSerializer,
    MeUpdateSerializer,
    PrefsSerializer,
    RegisterSerializer,
    UserReadSerializer,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        _, token = AuthToken.objects.create(user)
        return Response(
            {"user": UserReadSerializer(user).data, "token": token},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response(
                {"detail": "Nieprawidłowy e-mail lub hasło."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        _, token = AuthToken.objects.create(user)
        return Response({"user": UserReadSerializer(user).data, "token": token})


class MeView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return MeUpdateSerializer
        return UserReadSerializer


class MePrefsView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = PrefsSerializer(instance=request.user, data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserReadSerializer(user).data)

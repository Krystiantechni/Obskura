import re

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    """Mirror of registerSchema (Zod). Field `name` maps to User.display_name."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    name = serializers.CharField(min_length=2, max_length=60)
    terms = serializers.BooleanField()

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Konto z tym adresem e-mail już istnieje.")
        return value

    def validate_password(self, value):
        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError("Hasło musi zawierać wielką literę.")
        if not re.search(r"[0-9]", value):
            raise serializers.ValidationError("Hasło musi zawierać cyfrę.")
        return value

    def validate_terms(self, value):
        if value is not True:
            raise serializers.ValidationError("Wymagana akceptacja regulaminu.")
        return value

    def create(self, validated_data):
        validated_data.pop("terms", None)  # walidacyjne, nie trafia do modelu
        try:
            return User.objects.create_user(
                email=validated_data["email"],
                password=validated_data["password"],
                display_name=validated_data["name"],
            )
        except IntegrityError as exc:
            # Zabezpieczenie na wyścig: validate_email mógł przejść, a inny request
            # zdążył utworzyć konto przed INSERT — zwróć 400 zamiast 500.
            raise serializers.ValidationError(
                {"email": "Konto z tym adresem e-mail już istnieje."}
            ) from exc


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)


class UserReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "display_name", "prefs", "date_joined"]
        read_only_fields = ["id", "email", "display_name", "prefs", "date_joined"]


class MeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["display_name"]


class PrefsSerializer(serializers.Serializer):
    prefs = serializers.JSONField()

    def update(self, instance, validated_data):
        instance.prefs = validated_data["prefs"]
        instance.save(update_fields=["prefs"])
        return instance

from rest_framework import serializers

from support.models import FaqCategory, FaqItem


class TicketWriteSerializer(serializers.Serializer):
    name = serializers.CharField(
        min_length=2,
        max_length=60,
        error_messages={"min_length": "Imię jest wymagane.", "blank": "Imię jest wymagane."},
    )
    email = serializers.EmailField(error_messages={"invalid": "Nieprawidłowy adres e-mail."})
    category = serializers.CharField(
        min_length=1,
        max_length=40,
        error_messages={"blank": "Wybierz kategorię."},
    )
    message = serializers.CharField(
        min_length=10,
        max_length=5000,
        error_messages={"min_length": "Wiadomość musi mieć min. 10 znaków."},
    )


class FaqItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FaqItem
        fields = ["question", "answer", "order"]
        read_only_fields = fields


class FaqCategorySerializer(serializers.ModelSerializer):
    items = FaqItemSerializer(many=True, read_only=True)

    class Meta:
        model = FaqCategory
        fields = ["name", "slug", "order", "items"]
        read_only_fields = fields

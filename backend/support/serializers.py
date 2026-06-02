from rest_framework import serializers

from support.models import FaqCategory, FaqItem


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

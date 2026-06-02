from rest_framework import serializers

from pages.models import LegalDoc, PressItem


class LegalDocSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalDoc
        fields = ["kind", "version", "body", "published_at"]
        read_only_fields = fields


class PressItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PressItem
        fields = ["source", "quote", "author", "url", "order"]
        read_only_fields = fields

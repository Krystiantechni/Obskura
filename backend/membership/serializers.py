from rest_framework import serializers

from membership.models import PatronTier, Plan


class PlanSerializer(serializers.ModelSerializer):
    price_year_total = serializers.SerializerMethodField()

    def get_price_year_total(self, obj):
        return obj.price_year * 12

    class Meta:
        model = Plan
        fields = [
            "code",
            "name",
            "price_month",
            "price_year",
            "price_year_total",
            "currency",
            "featured",
            "tag",
            "badge",
            "cta_label",
            "monthly_quota",
            "features",
            "order",
        ]
        read_only_fields = fields


class PatronTierSerializer(serializers.ModelSerializer):
    seats_remaining = serializers.SerializerMethodField()

    def get_seats_remaining(self, obj):
        if obj.capacity is None:
            return None
        return obj.capacity - getattr(obj, "seats_taken", 0)

    class Meta:
        model = PatronTier
        fields = [
            "id",
            "code",
            "role_label",
            "title",
            "amount",
            "currency",
            "featured",
            "capacity",
            "seats_remaining",
            "requires_application",
            "perks",
            "order",
        ]
        read_only_fields = fields

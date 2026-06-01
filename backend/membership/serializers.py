from rest_framework import serializers

from membership.models import BillingPeriod, Patronage, PatronTier, Plan, PlanCode, Subscription


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


class SubscribeWriteSerializer(serializers.Serializer):
    """Kontrakt POST /membership/subscribe (lustro przyszłego Zod schema)."""

    plan_code = serializers.ChoiceField(choices=PlanCode.choices)
    billing_period = serializers.ChoiceField(choices=BillingPeriod.choices)


class SubscriptionReadSerializer(serializers.ModelSerializer):
    plan_code = serializers.CharField(source="plan.code", read_only=True)
    plan_name = serializers.CharField(source="plan.name", read_only=True)

    class Meta:
        model = Subscription
        fields = [
            "id",
            "plan_code",
            "plan_name",
            "status",
            "billing_period",
            "period_start",
            "period_end",
            "trial_end",
            "auto_renew",
            "cancel_at_period_end",
            "created_at",
        ]
        read_only_fields = fields


class PatronageWriteSerializer(serializers.Serializer):
    tier_id = serializers.IntegerField()
    is_anonymous = serializers.BooleanField(default=False, required=False)
    credit_name = serializers.CharField(
        max_length=120, allow_blank=True, required=False, default=""
    )
    is_company = serializers.BooleanField(default=False, required=False)
    company_name = serializers.CharField(
        max_length=200, allow_blank=True, required=False, default=""
    )


class PatronageReadSerializer(serializers.ModelSerializer):
    tier = PatronTierSerializer(read_only=True)

    class Meta:
        model = Patronage
        fields = [
            "id",
            "tier",
            "amount",
            "status",
            "is_anonymous",
            "credit_name",
            "anon_number",
            "is_company",
            "company_name",
            "created_at",
        ]
        read_only_fields = fields

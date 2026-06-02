from rest_framework import serializers

from newsletter.models import Campaign, Freq


class SubscribeWriteSerializer(serializers.Serializer):
    email = serializers.EmailField(error_messages={"invalid": "Nieprawidlowy adres e-mail."})
    freq = serializers.ChoiceField(choices=Freq.choices, default=Freq.WEEK, required=False)
    consent = serializers.BooleanField()

    def validate_consent(self, value):
        if value is not True:
            raise serializers.ValidationError("Wymagana zgoda na otrzymywanie wiadomosci.")
        return value


class UnsubscribeSerializer(serializers.Serializer):
    token = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False)

    def validate(self, attrs):
        if not attrs.get("token") and not attrs.get("email"):
            raise serializers.ValidationError("Podaj token lub e-mail.")
        return attrs


class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = ["code", "label", "purpose", "freq_label", "tag", "order"]
        read_only_fields = fields

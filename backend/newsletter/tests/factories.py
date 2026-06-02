import factory

from newsletter.models import Campaign, CampaignTag, Freq, Subscriber


class SubscriberFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Subscriber

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    freq = Freq.WEEK
    is_active = True


class CampaignFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Campaign

    code = factory.Sequence(lambda n: f"campaign-{n}")
    label = factory.Sequence(lambda n: f"Campaign {n}")
    purpose = factory.Sequence(lambda n: f"Purpose {n}")
    freq_label = "Jednorazowo"
    tag = CampaignTag.TRANSACTIONAL
    order = factory.Sequence(lambda n: n)
    is_active = True

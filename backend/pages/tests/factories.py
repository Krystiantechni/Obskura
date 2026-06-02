import factory
from django.utils import timezone

from pages.models import LegalDoc, LegalKind, PressItem


class LegalDocFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = LegalDoc

    kind = LegalKind.PRYWATNOSC
    version = "1.0.0"
    body = factory.Sequence(lambda n: f"Legal body text {n}")
    published_at = factory.LazyFunction(timezone.now)
    is_current = False


class PressItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PressItem

    source = factory.Sequence(lambda n: f"Source {n}")
    quote = factory.Sequence(lambda n: f"Press quote number {n}")
    author = factory.Sequence(lambda n: f"Author {n}")
    url = ""
    order = factory.Sequence(lambda n: n)
    is_active = True

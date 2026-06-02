import factory

from support.models import FaqCategory, FaqItem


class FaqCategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = FaqCategory

    name = factory.Sequence(lambda n: f"Category {n}")
    slug = factory.Sequence(lambda n: f"category-{n}")
    order = factory.Sequence(lambda n: n)
    is_active = True


class FaqItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = FaqItem

    category = factory.SubFactory(FaqCategoryFactory)
    question = factory.Sequence(lambda n: f"Question {n}?")
    answer = factory.Sequence(lambda n: f"Answer to question {n}.")
    order = factory.Sequence(lambda n: n)
    is_active = True

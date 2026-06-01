from datetime import timedelta

import factory
from django.utils import timezone

from accounts.tests.factories import UserFactory
from catalog.tests.factories import CreatorFactory
from events.models import Event, EventMode, EventStatus, Registration, RegStatus


class EventFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Event
        exclude = ["_title"]

    _title = factory.Sequence(lambda n: f"Event {n}")
    title = factory.LazyAttribute(lambda o: o._title)
    # slug is auto-generated in Event.save() — leave blank so save() fills it
    slug = ""
    mode = EventMode.ONLINE
    starts_at = factory.LazyFunction(lambda: timezone.now() + timedelta(days=7))
    capacity = None
    price_pln = 0
    status = EventStatus.PUBLISHED
    host = factory.SubFactory(CreatorFactory)

    class Params:
        # Allow caller to pass host=None explicitly
        pass


class RegistrationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Registration

    event = factory.SubFactory(EventFactory)
    user = factory.SubFactory(UserFactory)
    status = RegStatus.CONFIRMED

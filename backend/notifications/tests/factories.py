import factory

from accounts.tests.factories import UserFactory
from notifications.models import Notification, NotificationKind


class NotificationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Notification

    user = factory.SubFactory(UserFactory)
    kind = NotificationKind.SYSTEM
    title = factory.Sequence(lambda n: f"Powiadomienie {n}")
    body = ""
    url = ""
    payload = factory.LazyFunction(dict)
    read_at = None

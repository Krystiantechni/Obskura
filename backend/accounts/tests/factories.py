import factory
from django.contrib.auth import get_user_model

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    # Bounded (<=60) i deterministyczny — Faker("name") bywa dłuższy niż max_length.
    display_name = factory.Sequence(lambda n: f"User {n}")

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        self.set_password(extracted or "Secret123")
        if create:
            self.save()

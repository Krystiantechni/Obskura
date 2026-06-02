import pytest
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from knox.models import AuthToken

from accounts.tests.factories import UserFactory
from notifications.middleware import TokenAuthMiddleware


class _Inner:
    def __init__(self):
        self.scope = None

    async def __call__(self, scope, receive, send):
        self.scope = scope


@pytest.mark.django_db(transaction=True)
async def test_middleware_sets_user_for_valid_token():
    user = await database_sync_to_async(UserFactory)()
    token = await database_sync_to_async(lambda: AuthToken.objects.create(user)[1])()
    inner = _Inner()
    mw = TokenAuthMiddleware(inner)
    scope = {"type": "websocket", "query_string": f"token={token}".encode()}
    await mw(scope, None, None)
    assert inner.scope["user"].id == user.id


@pytest.mark.django_db(transaction=True)
async def test_middleware_anonymous_for_bad_token():
    inner = _Inner()
    mw = TokenAuthMiddleware(inner)
    scope = {"type": "websocket", "query_string": b"token=bogus"}
    await mw(scope, None, None)
    assert isinstance(inner.scope["user"], AnonymousUser)

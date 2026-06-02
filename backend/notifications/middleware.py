from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser


@database_sync_to_async
def _user_from_token(token):
    from knox.auth import TokenAuthentication
    from rest_framework.exceptions import AuthenticationFailed

    if not token:
        return AnonymousUser()
    try:
        user, _auth = TokenAuthentication().authenticate_credentials(token.encode())
        return user
    except AuthenticationFailed:
        return AnonymousUser()


class TokenAuthMiddleware(BaseMiddleware):
    """Uwierzytelnianie WS po Knox tokenie z query stringa (?token=...)."""

    async def __call__(self, scope, receive, send):
        qs = parse_qs((scope.get("query_string") or b"").decode())
        token = (qs.get("token") or [None])[0]
        scope["user"] = await _user_from_token(token)
        return await super().__call__(scope, receive, send)

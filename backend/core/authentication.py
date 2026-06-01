from knox.auth import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed


class OptionalTokenAuthentication(TokenAuthentication):
    """Knox auth dla endpointów publicznych, które chcą ROZPOZNAĆ zalogowanego.

    Standardowy Knox rzuca AuthenticationFailed (→ 401) gdy nagłówek Authorization
    niesie nieważny/wygasły token — co psułoby publiczny (AllowAny) endpoint dla
    klienta ze starym tokenem. Tu nieudane uwierzytelnienie traktujemy jak anonima
    (zwracamy None) — request przechodzi jako publiczny, a request.user = AnonymousUser.
    """

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except AuthenticationFailed:
            return None

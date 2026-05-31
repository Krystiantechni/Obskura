from django.core.cache import cache
from django.db import connection
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    """Publiczny smoke test: DB + cache. Używany przez monitoring i deploy."""

    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes: list = []

    def get(self, request):
        db_ok = self._check_db()
        cache_ok = self._check_cache()
        healthy = db_ok and cache_ok
        return Response(
            {
                "status": "ok" if healthy else "degraded",
                "database": "ok" if db_ok else "error",
                "cache": "ok" if cache_ok else "error",
            },
            status=200 if healthy else 503,
        )

    @staticmethod
    def _check_db() -> bool:
        try:
            connection.ensure_connection()
            return True
        except Exception:
            return False

    @staticmethod
    def _check_cache() -> bool:
        try:
            cache.set("__health__", "1", 5)
            return cache.get("__health__") == "1"
        except Exception:
            return False

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "obskura.settings")
# Channels rozszerzy to w fazie B7 (ProtocolTypeRouter).
application = get_asgi_application()

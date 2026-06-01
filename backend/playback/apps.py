from django.apps import AppConfig


class PlaybackConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "playback"

    def ready(self):
        from playback import signals  # noqa: F401

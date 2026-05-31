from rest_framework.routers import DefaultRouter

from catalog.views import CreatorViewSet, EpisodeViewSet, GenreViewSet, SeasonViewSet

router = DefaultRouter(trailing_slash=False)
router.register("catalog/episodes", EpisodeViewSet, basename="episode")
router.register("catalog/seasons", SeasonViewSet, basename="season")
router.register("catalog/genres", GenreViewSet, basename="genre")
router.register("catalog/creators", CreatorViewSet, basename="creator")

urlpatterns = router.urls

from rest_framework.routers import DefaultRouter

from membership.views import PatronTierViewSet, PlanViewSet

router = DefaultRouter(trailing_slash=False)
router.register("membership/plans", PlanViewSet, basename="plan")
router.register("membership/patron-tiers", PatronTierViewSet, basename="patron-tier")

urlpatterns = router.urls

from django_filters import rest_framework as filters

from catalog.models import Episode


class EpisodeFilter(filters.FilterSet):
    genre = filters.CharFilter(field_name="genre__slug")
    season = filters.NumberFilter(field_name="season__number")

    class Meta:
        model = Episode
        fields = ["genre", "season", "kind", "is_true_horror", "premium"]

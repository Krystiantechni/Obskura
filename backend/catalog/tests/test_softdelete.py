import pytest

from catalog.models import Episode
from catalog.tests.factories import EpisodeFactory


@pytest.mark.django_db
def test_instance_delete_is_soft():
    ep = EpisodeFactory()
    pk = ep.pk
    ep.delete()
    assert not Episode.objects.filter(pk=pk).exists()
    obj = Episode.all_objects.get(pk=pk)
    assert obj.is_deleted is True
    assert obj.deleted_at is not None


@pytest.mark.django_db
def test_queryset_bulk_delete_is_soft():
    EpisodeFactory.create_batch(3)
    Episode.objects.all().delete()
    assert Episode.objects.count() == 0
    assert Episode.all_objects.count() == 3
    assert all(o.is_deleted for o in Episode.all_objects.all())
    # bulk path (QuerySet.update) musi też ustawić deleted_at — inny code-path niż instance delete
    assert all(o.deleted_at is not None for o in Episode.all_objects.all())


@pytest.mark.django_db
def test_default_manager_excludes_deleted():
    keep = EpisodeFactory()
    gone = EpisodeFactory()
    gone.delete()
    slugs = set(Episode.objects.values_list("slug", flat=True))
    assert keep.slug in slugs
    assert gone.slug not in slugs

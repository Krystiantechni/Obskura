import pytest

from catalog.models import Chapter, TranscriptLine
from catalog.tests.factories import EpisodeFactory


@pytest.mark.django_db
def test_chapter_belongs_to_episode_ordered():
    ep = EpisodeFactory()
    Chapter.objects.create(episode=ep, n=2, key="ch2", title="B", sec=100)
    Chapter.objects.create(episode=ep, n=1, key="ch1", title="A", sec=0)
    assert [c.n for c in ep.chapters.all()] == [1, 2]


@pytest.mark.django_db
def test_transcript_spoken_and_marker_variants():
    ep = EpisodeFactory()
    spoken = TranscriptLine.objects.create(
        episode=ep, key="t1", order=0, sec=10, speaker="narratorka", text="..."
    )
    marker = TranscriptLine.objects.create(
        episode=ep, key="m1", order=1, marker=TranscriptLine.Marker.SFX, text="SFX ..."
    )
    assert spoken.sec == 10 and spoken.marker == ""
    assert marker.sec is None and marker.marker == "sfx"

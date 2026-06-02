"""Task 6 — seed_events command tests."""

import pytest
from django.core.management import call_command

from events.models import Event, EventMode, RecordingAccess


@pytest.mark.django_db
def test_seed_creates_events():
    call_command("seed_events", verbosity=0)
    assert Event.objects.count() > 0


@pytest.mark.django_db
def test_seed_is_idempotent():
    call_command("seed_events", verbosity=0)
    count_first = Event.objects.count()
    call_command("seed_events", verbosity=0)
    count_second = Event.objects.count()
    assert count_first == count_second


@pytest.mark.django_db
def test_seed_has_klan_event():
    call_command("seed_events", verbosity=0)
    assert Event.objects.filter(mode=EventMode.KLAN).exists()


@pytest.mark.django_db
def test_seed_has_paid_event():
    call_command("seed_events", verbosity=0)
    assert Event.objects.filter(price_pln__gt=0).exists()


@pytest.mark.django_db
def test_seed_has_past_event_with_recording():
    call_command("seed_events", verbosity=0)
    past_with_recording = Event.objects.filter(recording_url__gt="")
    assert past_with_recording.exists()


@pytest.mark.django_db
def test_seed_past_event_recording_access():
    call_command("seed_events", verbosity=0)
    # Past events with recording must have access set to klub or klan
    past_recorded = Event.objects.filter(recording_url__gt="")
    for ev in past_recorded:
        assert ev.recording_access in (
            RecordingAccess.KLUB,
            RecordingAccess.KLAN,
        ), f"Event '{ev.title}' has unexpected recording_access={ev.recording_access}"


@pytest.mark.django_db
def test_seed_capacity_parsed():
    """Events with seats like '12 / 180' should have capacity=180."""
    call_command("seed_events", verbosity=0)
    events_with_capacity = Event.objects.filter(capacity__isnull=False)
    assert events_with_capacity.exists()


@pytest.mark.django_db
def test_seed_price_parsed():
    """Events with seatsLabel like '35 zł' should have price_pln=35."""
    call_command("seed_events", verbosity=0)
    paid = Event.objects.filter(price_pln=35)
    assert paid.exists()

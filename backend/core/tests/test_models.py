from core.models import SoftDeleteModel, TimeStampedModel


def test_timestamped_is_abstract():
    assert TimeStampedModel._meta.abstract is True
    field_names = {f.name for f in TimeStampedModel._meta.get_fields()}
    assert {"created_at", "updated_at"} <= field_names


def test_softdelete_is_abstract():
    assert SoftDeleteModel._meta.abstract is True
    field_names = {f.name for f in SoftDeleteModel._meta.get_fields()}
    assert {"is_deleted", "deleted_at"} <= field_names


def test_softdelete_has_manager_with_alive_filter():
    # Manager domyślny zwraca tylko żywe; all_objects zwraca wszystko.
    # Na modelach abstrakcyjnych ManagerDescriptor rzuca AttributeError przy
    # dostępie (hasattr zwraca False) — sprawdzamy przez __dict__ i _meta.
    manager_names = {m.name for m in SoftDeleteModel._meta.managers}
    assert "objects" in manager_names
    assert "all_objects" in manager_names

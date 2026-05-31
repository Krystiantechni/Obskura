from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    """Bazowy mixin: znaczniki czasu z indeksem na created_at (sort/filtry)."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class SoftDeleteQuerySet(models.QuerySet):
    def alive(self):
        return self.filter(is_deleted=False)

    def delete(self):
        # Bulk soft-delete. Uwaga: NIE rusza `updated_at` (auto_now odpala tylko na
        # Model.save(), nie na QuerySet.update()) — świadoma decyzja. Instance-level
        # del() poniżej przechodzi przez save(), więc tam updated_at się odświeży.
        return self.update(is_deleted=True, deleted_at=timezone.now())


class SoftDeleteManager(models.Manager):
    """Domyślny manager — zwraca tylko nieusunięte rekordy."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).alive()


class SoftDeleteModel(models.Model):
    """Soft-delete: `objects` = żywe, `all_objects` = wszystkie."""

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()  # _default_manager: aplikacja widzi tylko żywe
    # noqa poniżej: DJ012 to false-positive — ruff gubi kolejność przy custom managerze
    # (objects=SoftDeleteManager). Układ pola→managery→Meta jest zgodny ze stylem Django.
    all_objects = models.Manager()  # noqa: DJ012

    class Meta:
        abstract = True
        # Operacje wewnętrzne Django (cascade, walidacja FK) używają _base_manager —
        # musi być NIEfiltrowany, inaczej "zgubiłby" soft-deleted wiersze.
        base_manager_name = "all_objects"

    def delete(self, using=None, keep_parents=False):
        # keep_parents to no-op: soft-delete nie usuwa żadnego wiersza z bazy.
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at"])
        # Zachowaj kontrakt Model.delete(): (liczba, {label: liczba}).
        return 1, {self._meta.label: 1}

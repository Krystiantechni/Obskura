from core.pagination import DefaultCursorPagination


class ThreadCursorPagination(DefaultCursorPagination):
    # DRF CursorPagination używa TYLKO ordering[0] do pozycji kursora, więc pierwsze pole
    # musi być monotoniczne (nie boolean). Sortujemy po aktywności; -id to stabilny tiebreaker.
    # is_pinned NIE jest w kursorze (boolean rozbiłby paginację) — klient wyróżnia przypięte
    # po polu `is_pinned` z serializera.
    ordering = ("-last_post_at", "-id")


class PostCursorPagination(DefaultCursorPagination):
    # Posty rosnąco (chronologia wątku); id tiebreaker dla stabilności kursora.
    ordering = ("created_at", "id")

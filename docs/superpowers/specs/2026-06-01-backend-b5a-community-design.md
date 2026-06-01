# Faza B5a — Community (forum) — Design Spec

> Status: **zatwierdzony do planu** (brainstorming → writing-plans).
> Data: 2026-06-01. B5 rozbite na dwa shippable podsystemy: **B5a Community (forum)** ← ten spec, oraz **B5b Events** (osobny spec/plan później).
> Poprzednie: B0–B4 (ostatnio B4 membership). Wzorzec: [`2026-06-01-backend-b4-membership-design.md`](2026-06-01-backend-b4-membership-design.md).

---

## 1. Cel

Forum społeczności OBSKURY: kategorie, wątki (opcjonalnie powiązane z odcinkiem), posty, **reakcje**, oraz **pełny pipeline moderacji** (statusy postów, zgłoszenia użytkowników, rola moderatora, audit log). Front (`src/pages/Forum.jsx`) jest dziś w 100% statycznym mockiem — B5a definiuje cały kontrakt od zera; read serializery odwzorowują kształty, których front oczekuje, żeby dało się go podpiąć bez przeprojektowania.

## 2. Decyzje (rozstrzygnięte z userem)

1. **Split B5** — community najpierw (ten spec), events osobno (B5b).
2. **Pełny pipeline moderacji** — `Post.status` (published/pending/flagged/removed), model `Report`, `ModerationAction` (audit), rola moderatora, pre-publish approval dla kategorii moderowanych.
3. **Reakcje teraz** — `Reaction(post, user, kind)` z `unique(post, user, kind)`, denormalizacja liczników przez signal.
4. **Rola moderatora = `is_moderator` (BooleanField, default False) na `accounts.User`** (addytywna migracja w accounts). Uprawnienie moderacji: `is_moderator || is_staff || is_superuser`.
5. **Read publiczny, write wymaga konta.** Kategoria `is_moderated` → nowe wątki/posty `pending` do zatwierdzenia.
6. Konwencje 1:1 jak B4: `TimeStampedModel`/`SoftDeleteModel`, selectors/services/signals, split read/write serializery, cursor pagination, Redis cache + invalidacja signalem, ruff, pytest + factory_boy.

### Świadomie poza zakresem B5a (deferred)
- **Events** (Event/Registration, bilety Stripe) → faza B5b.
- Per-post **anonimowość** („Anonim #047" to po prostu `display_name` usera — front pokazuje pseudonim; brak osobnej flagi).
- **Powiadomienia** o odpowiedziach, **edycja/historia** postów, **podforum gated membershipem**, reakcje-UI na froncie, dedup wyświetleń.

---

## 3. Architektura

Nowy app **`community`** obok accounts/catalog/playback/membership. Warstwy jak w reszcie repo:

```
models.py       Category, Thread, Post, Reaction, Report, ModerationAction + TextChoices
selectors.py    read-querysety (zero N+1, select_related/prefetch), *_cached (Redis), widoczność
services.py     mutacje @transaction.atomic: create_thread, create_post, toggle_reaction,
                report_post, moderate_post (approve/reject/remove/restore), set_thread_flag, resolve_report
signals.py      denormalizacja (threads_count, posts_count, reaction_count/breakdown, last_post_at)
                + invalidacja cache "community:*"
permissions.py  IsModerator (is_moderator|is_staff|is_superuser)
serializers.py  split read/write
views.py        cienkie APIView/ViewSet → selectors/services
urls.py         /api/v1/community/... (bez trailing slash)
admin.py        rejestracja modeli (list_select_related + autocomplete_fields)
tests/          factories.py + test_*.py (pytest, knox auth, N+1 guards)
```

Touched (existing): `accounts/models.py` (+`is_moderator`) + migracja accounts; `obskura/settings.py` (INSTALLED_APPS += "community"); `obskura/urls.py` (include).

Zależność: `community` zależy od `catalog` (FK `Thread.episode`) i `accounts` (autor, moderator). Brak zależności od membership w B5a.

---

## 4. Model danych

### `Category(TimeStampedModel)` — sekcje forum (admin-managed, cache)
| pole | typ | uwagi |
|---|---|---|
| `name` | CharField | |
| `slug` | SlugField unique | `pl_slugify(name)` w save() |
| `description` | TextField blank | |
| `icon` | CharField blank | klucz ikony lucide (np. "MessageSquare") |
| `is_moderated` | BooleanField default False | True → posty pending do approvalu |
| `order` | PositiveIntegerField default 0 | |
| `is_active` | BooleanField default True | |

Denorm: `threads_count` (PositiveIntegerField default 0, przez signal — liczba widocznych wątków). Meta.ordering `["order"]`.

### `Thread(TimeStampedModel, SoftDeleteModel)`
| pole | typ | uwagi |
|---|---|---|
| `category` | FK Category PROTECT, related_name="threads", db_index | |
| `author` | FK AUTH_USER_MODEL PROTECT, related_name="threads" | |
| `title` | CharField | |
| `slug` | SlugField unique | `pl_slugify(title)` + sufiks przy kolizji |
| `episode` | FK catalog.Episode SET_NULL null/blank, related_name="threads" | „Dyskusje o odcinkach" |
| `is_pinned` | BooleanField default False, db_index | |
| `is_locked` | BooleanField default False | |
| `last_post_at` | DateTimeField db_index | =created_at na starcie, bump przy nowym poście |

Denorm: `posts_count` (published odpowiedzi, bez pierwszego), `views_count`. Meta indexes: `["category","-last_post_at"]`, `["-is_pinned","-last_post_at"]`. `base_manager_name="all_objects"` (SoftDelete).

### `Post(TimeStampedModel, SoftDeleteModel)`
| pole | typ | uwagi |
|---|---|---|
| `thread` | FK Thread CASCADE, related_name="posts", db_index | |
| `author` | FK AUTH_USER_MODEL PROTECT, related_name="posts" | |
| `body` | TextField | |
| `is_first` | BooleanField default False | post otwierający wątek |
| `status` | CharField choices PostStatus, default zależny od kategorii | published/pending/flagged/removed |

Denorm: `reaction_count` (PositiveIntegerField), `reactions_breakdown` (JSONField default=dict, `{kind: n}`). Meta indexes: `["thread","created_at"]`, `["status"]`. `base_manager_name="all_objects"`.

`PostStatus`: `PUBLISHED="published"`, `PENDING="pending"`, `FLAGGED="flagged"`, `REMOVED="removed"`.

### `Reaction(TimeStampedModel)`
| pole | typ | uwagi |
|---|---|---|
| `post` | FK Post CASCADE, related_name="reactions" | |
| `user` | FK AUTH_USER_MODEL CASCADE, related_name="reactions" | |
| `kind` | CharField choices ReactionKind | |

Constraint: `UniqueConstraint(fields=["post","user","kind"], name="uniq_reaction_post_user_kind")`. Index `["post"]`.
`ReactionKind`: `LIKE="like"` (👍), `SPOOKY="spooky"` (💀), `SCARED="scared"` (😱), `LOVE="love"` (❤️).

### `Report(TimeStampedModel)`
| pole | typ | uwagi |
|---|---|---|
| `reporter` | FK AUTH_USER_MODEL CASCADE, related_name="reports_made" | |
| `post` | FK Post CASCADE, related_name="reports" | |
| `reason` | CharField choices ReportReason | spam/offensive/spoiler/offtopic/other |
| `detail` | TextField blank | |
| `status` | CharField choices ReportStatus, default OPEN | open/resolved/dismissed |
| `handled_by` | FK AUTH_USER_MODEL SET_NULL null, related_name="reports_handled" | |
| `resolution` | TextField blank | |

Constraint: `UniqueConstraint(fields=["reporter","post"], name="uniq_report_reporter_post")`. Tworzenie raportu → `Post.status=FLAGGED` (jeśli był published).

### `ModerationAction(TimeStampedModel)` — audit log
| pole | typ | uwagi |
|---|---|---|
| `moderator` | FK AUTH_USER_MODEL PROTECT, related_name="moderation_actions" | |
| `post` | FK Post SET_NULL null/blank | |
| `thread` | FK Thread SET_NULL null/blank | |
| `action` | CharField choices ModAction | approve/reject/remove/restore/pin/unpin/lock/unlock/flag |
| `reason` | TextField blank | |

Tylko zapis (append-only). Meta.ordering `["-created_at"]`.

---

## 5. Widoczność i uprawnienia

`community.selectors.visible_posts(*, viewer)` / `visible_threads(*, viewer)` — reguła:
- **Anonim / inny user:** tylko `status=PUBLISHED` (i wątki, których pierwszy post jest published).
- **Autor:** widzi swoje własne `PENDING`/`FLAGGED` (żeby wiedział, że czeka na moderację).
- **Moderator** (`is_moderator|is_staff|is_superuser`): widzi wszystko.

`permissions.IsModerator` — gating endpointów moderacyjnych. Write (tworzenie wątku/posta/reakcji/raportu) = `IsAuthenticated`. Read = `AllowAny` + `OptionalTokenAuthentication` (personalizacja widoczności pending dla autora).

`is_locked` wątek → `create_post` rzuca `PermissionDenied` (kod `thread_locked`) dla nie-moderatora.

---

## 6. Przepływy (services)

- `create_thread(*, user, category, title, body, episode=None)` → tworzy Thread + pierwszy Post (`is_first=True`). Status pierwszego posta: `PENDING` jeśli `category.is_moderated`, inaczej `PUBLISHED`. `last_post_at=now`. Zwraca thread.
- `create_post(*, user, thread, body)` → walidacja `is_locked`; status `PENDING`/`PUBLISHED` wg kategorii; bump `last_post_at`; zwraca post.
- `toggle_reaction(*, user, post, kind)` → `get_or_create`/`delete` Reaction; zwraca `{reacted: bool}`. Signal przelicza `reaction_count`/breakdown.
- `report_post(*, user, post, reason, detail)` → `get_or_create` Report (unique reporter+post); jeśli post `PUBLISHED` → `FLAGGED`. Audit.
- `moderate_post(*, moderator, post, action, reason="")` → approve(→PUBLISHED)/reject(→REMOVED, pending)/remove(→REMOVED)/restore(→PUBLISHED); zapis `ModerationAction`.
- `set_thread_flag(*, moderator, thread, action)` → pin/unpin/lock/unlock; audit.
- `resolve_report(*, moderator, report, status, resolution)` → resolved/dismissed + `handled_by`.

Wszystkie mutacje `@transaction.atomic`, keyword-only, F()/aggregate dla liczników jak w playback/membership.

---

## 7. API (`/api/v1/community/...`, bez trailing slash)

| Metoda | Ścieżka | Auth | Uwagi |
|---|---|---|---|
| GET | `/community/categories` | AllowAny | Redis cache, `threads_count` |
| GET | `/community/threads?category=&episode=` | AllowAny+opt | cursor `(-is_pinned, -last_post_at)`, tylko widoczne |
| GET | `/community/threads/{slug}` | AllowAny+opt | wątek + posty (cursor `created_at`), `views_count++` |
| POST | `/community/threads` | IsAuth | tworzy wątek + pierwszy post |
| POST | `/community/threads/{slug}/posts` | IsAuth | odpowiedź |
| POST/DELETE | `/community/posts/{id}/reactions` | IsAuth | body `{kind}` (toggle) |
| POST | `/community/posts/{id}/report` | IsAuth | `{reason, detail}` |
| GET | `/community/moderation/queue` | IsModerator | pending + flagged |
| POST | `/community/posts/{id}/moderate` | IsModerator | `{action, reason}` |
| POST | `/community/threads/{slug}/flag` | IsModerator | `{action}` (pin/unpin/lock/unlock) |
| GET | `/community/reports` | IsModerator | open reports |
| POST | `/community/reports/{id}/resolve` | IsModerator | `{status, resolution}` |

Serializery: read (Category/Thread list+detail/Post) ModelSerializer z explicit fields + read_only_fields; write `serializers.Serializer` z walidacją (lustro przyszłego Zod) i polskimi komunikatami. Autor eksponowany jako `author_name` (display_name/email-fallback) — nie cały user.

## 8. Cache, denormalizacja, paginacja

- Redis `community:categories` (TTL 15m) — invalidacja signalem post_save/post_delete na Category (+ przy zmianie `threads_count`). Fallback LocMemCache jak w membership.
- Signals: `Post` save/delete → przelicz `Thread.posts_count` (published, bez first), bump `Thread.last_post_at`, `Category.threads_count`. `Reaction` save/delete → `Post.reaction_count` + `reactions_breakdown`. F()/aggregate na `all_objects`.
- `views_count` — `F()+1` przy GET detalu (akceptowany write-on-read, bez dedupu).
- Pagination: `ThreadCursorPagination` ordering `("-is_pinned","-last_post_at","-id")`; `PostCursorPagination` ordering `("created_at","id")`. Kategorie — bez paginacji (skończona lista).

## 9. Testy (pytest + factory_boy)

Factories: Category/Thread/Post/Reaction/Report/ModerationAction (+ UserFactory z accounts, EpisodeFactory z catalog). Auth: knox `_client(user)`; helper `_moderator()`.
Pokrycie: categories (public, cache, N+1); threads list (pinned-first, filtry category/episode, tylko widoczne, N+1); thread detail (+views inc, posty); create thread/post (auth required, moderated→pending, locked→403); reactions (toggle, unique, breakdown denorm); report (unique, flaguje post); moderacja (queue tylko mod, approve/reject/remove/restore, pin/lock, audit zapisany); widoczność (autor widzi swoje pending, obcy nie, mod widzi wszystko).

## 10. Zarys tasków (rozwinie writing-plans; commit per task, EN, bez Co-Authored-By)

1. Scaffold app `community` + `INSTALLED_APPS`/`urls` + `accounts.User.is_moderator` (+migracja accounts) + `permissions.IsModerator`.
2. Modele Category/Thread/Post/Reaction/Report/ModerationAction + TextChoices + migracja (indexy/constraints).
3. Read: categories + threads (list/detail) — selectors (widoczność, zero N+1) + cache + serializery + paginacja.
4. Write: create_thread + create_post (moderated→pending, locked) + serializery write.
5. Reactions: toggle endpoint + signal denormalizacji (`reaction_count`/breakdown).
6. Reports + moderacja: report_post, moderation queue, moderate_post, thread flags, resolve_report + audit + IsModerator.
7. Signals denormalizacji (posts_count/threads_count/last_post_at) + cache invalidacja + admin + seed (opcjonalny `seed_community` z danymi z Forum.jsx).

**Definition of Done (B5a):** pełny `pytest` zielony (community + niezłamane reszta), `ruff`/`format`/`manage.py check`/`makemigrations --check` czyste, endpointy z §7 działają, widoczność i moderacja z §5/§6 wymuszone, denormalizacja liczników poprawna.

**Następna faza:** B5b — Events (wydarzenia online/live/klan, zapisy + capacity + waitlist, klan-gating przez membership, płatne bilety przez Stripe).

# ADR-003 — Daily status propagation and calendar rules

**Status:** Accepted product rules; implementation safeguards documented below

## Approval context

During implementation, the developer authorized the complete Daily implementation
while retaining Regular functionality. In response to the status question, the
developer specifically requested the behavior of Regular's existing `aggregate`
and `applyDown`. In response to the calendar question, the developer approved
neutral empty days, today's default start, nonempty weekday selection, tomorrow's
edit/delete effective date, preservation of unmaterialized today, and device-local
current dates with stable stored date labels.

## Status decision

- A manual node update changes that node and all descendants currently `todo`.
  Already marked descendants retain their status.
- An affected ancestor adopts the common direct-child status, or `todo` for mixed
  children. This applies equally to `done`, `excused`, `failed`, and `todo`.
- Streaks inspect root outcomes. A manually marked root may differ from previously
  marked children, as in Regular.
- Daily implements these rules independently in `src/utils/dailyStatus.ts`.

## Calendar decision

- Empty days preserve both streaks without incrementing them.
- Creation defaults to today and requires a nonempty weekly selection. The UI
  permits an explicit future start, but not retroactive creation.
- Editing and deletion take effect tomorrow. Today's original occurrence is
  materialized before a structural change when scheduled; unscheduled days remain
  unscheduled. Historical revisions are retained even without occurrence rows.
- Current dates use the device timezone; stored `YYYY-MM-DD` labels are immutable.

## Implementation choices

### Shared menus and one schedule per tree

After device review, the developer approved using Regular's menu and form
presentation for Daily, with a single root schedule inherited by all descendants.
Only root editing exposes recurrence controls; child editing changes title/note.
Node additions, edits, and subtree removal take effect tomorrow. Targeted edits
read the latest revision within their transaction, so sequential edits do not
replace other pending changes. All Repetitions exposes the pending tree for
further nesting/editing before tomorrow. Regular business logic is unchanged;
only presentation fields and form actions are shared.

### Calendar safeguards

- Past and future dates are read-only. Status changes are accepted only for today;
  future calendar navigation is a preview and does not persist occurrences.
- The default weekly anchor is Monday of the scheduling creation week. The form
  exposes the reference Monday explicitly for alternating-week schedules.
- A structural edit is rejected if a clock rollback would place it before an
  already recorded later occurrence or revision. Already finalized persisted
  failures are not changed back to `todo` after a clock rollback. The app does not
  claim trusted time or timezone-aware travel reconciliation.
- The foreground clock check and app-resume reload improve the open-app view;
  historical schedule reconstruction is responsible for closed-app correctness.

## Verification

Tests cover status preservation and aggregation, neutral streak continuity,
unmaterialized history, same-day edits/deletion, date isolation, and the rollback
guard. Native timezone changes, timers, keyboard behavior, backup restoration, and
Android process restarts remain device acceptance checks.

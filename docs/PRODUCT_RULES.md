# MYD-app — product rules

**Status:** Approved product requirements unless marked `OPEN` or `PROPOSED`.

## Purpose and scope

MYD-app is a personal Android task-management app that helps its owner follow through on intentions and complete planned work. The first milestone is a stable, locally installed Android APK. Public release, accounts, cloud sync, and multi-user workflows are out of scope unless explicitly requested.

## Product principles (approved)

1. **Execution over planning.** Help the user act instead of endlessly organizing lists.
2. **Visible progress.** Show what has already been achieved.
3. **Consistency matters.** Encourage returning to planned work, not just one-off completion.
4. **Simplicity.** Adding and completing a task should be quick.
5. **Honest statistics.** Progress and streaks reflect actual dated task outcomes.

## Navigation and day view (approved)

- Daily Tasks is the initial screen when the app starts.
- Show tasks scheduled for the selected date and streak information at the top.
- A mini-calendar lets the user select another date to review historical results.
- Regular Tasks are a separate feature accessed through navigation.

## Distinct domains (approved)

- Regular and Daily Tasks have separate business logic, stores, services, and status aggregation.
- Reuse domain-neutral presentation components only when helpful.
- `TaskStatus` currently exists as a shared union in code; allowed values differ by domain:
  - Regular: `todo`, `done`, `failed`, `paused`.
  - Daily: `todo`, `done`, `failed`, `excused`.

## Daily recurrence and history (approved)

- Daily Tasks are recurring task templates. They may contain nested subtasks.
- One root schedule applies to its entire subtask tree. Subtasks do not have
  independent recurrence dates. Schedule editing is available only on the root.
- A task can repeat on chosen weekdays every `N` weeks (`N >= 1`), or on a chosen day of each month.
- A monthly day missing from a month falls back to that month's last day (e.g. 31st → April 30, February 28/29).
- Every scheduled date has an independent outcome and independently tracked subtask statuses.
- At the end of a local calendar day, any scheduled occurrence left unmarked (`todo`) is considered `failed`.
- This rule must hold even if the app stayed closed for days; do not rely solely on a midnight timer.
- Editing a recurring task affects future dates only, starting on the day after editing. Existing occurrences for the current and past days retain their original content and outcomes.
- Deleting a recurring task prevents future appearances; historical tasks/occurrences and their subtasks remain readable.
- Adding, editing, or deleting a subtask also takes effect tomorrow. Deleting a
  subtask removes its future subtree, preserving its siblings, the root schedule,
  and all current/past occurrence content and outcomes.

## Streaks: daily domain only (approved)

### Perfect Streak

- A completed day qualifies only if **all** scheduled Daily Tasks are `done`.
- A `failed`, `excused`, or unmarked task disqualifies the day and breaks Perfect Streak.
- `excused` is an allowed Daily Task outcome, but not equivalent to completion.

### Active Streak

- If every scheduled task is `done` or `excused` **and at least one is `done`**: success, increase by 1.
- If **all** scheduled tasks are `excused`: neutral day; preserve the existing streak count and continuity, but do not increase it.
- If any task is `failed` or was left `todo` at day end: failure; reset the streak.
- Streaks apply to root scheduled Daily Tasks, using the approved aggregation rules below.

## Daily rules approved during implementation

- Daily status propagation matches Regular behavior but is implemented independently.
  Changing a node manually always changes that node, then changes only descendants
  currently in `todo`. Already marked descendants retain their statuses.
- After changing a child, ancestors use the common child status when all direct
  children agree; otherwise they become `todo`. In particular, mixed `done` and
  `excused` is `todo`, resolving to `failed` when the day ends unless marked again.
- Manual parent outcomes can differ from already marked child outcomes. Streaks
  use the root outcome, not a second aggregation of all descendants.
- A day with zero scheduled roots is neutral for both streaks: preserve continuity
  and the existing count without increasing it.
- New schedules default to today. The user may choose a future start date;
  retroactive creation is unavailable. Weekly schedules require at least one day.
- Edits and logical deletion take effect tomorrow, including when today's occurrence
  has not been stored. Today's original schedule and tree remain available.
- The current day uses the device timezone. Stored date labels are never shifted
  when the timezone changes. Resolved persisted failures are not undone by moving
  the clock backward. See ADR-003 for the clock-rollback guard.

See `docs/decisions/ADR-003-DAILY-STATUS-AND-CALENDAR.md` for approval context
and implementation choices.

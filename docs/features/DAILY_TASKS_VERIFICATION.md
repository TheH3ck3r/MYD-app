# Daily Tasks — implementation handoff

## Full-tree streak follow-up

Approved after APK review: Perfect and Active now inspect every node in scheduled
Daily trees. Failed or unfinished parents/descendants break both streaks; excused
nodes break Perfect. Active gains one for a completed day with only done/excused
nodes and at least one done node. All-excused days bridge Active without adding
one; empty days bridge both. Today remains excluded, and tree size never changes
the number of days added.

Counters are derived from historical snapshots on each calculation. No database
migration or historical status rewrite is involved. Existing streaks can become
shorter under the new rules; a done parent no longer hides failed descendants.
Status propagation and Regular behavior remain unchanged.

Files changed for this follow-up: `src/utils/dailyStreaks.ts`,
`src/components/daily/StreakSheet.tsx`, `tests/dailyStreaks.test.mjs`,
`docs/PRODUCT_RULES.md`, `docs/features/DAILY_TASKS.md`,
`docs/decisions/ADR-003-DAILY-STATUS-AND-CALENDAR.md`, and this document.

Validation: all 59 tests pass, including all 64 combinations of three nested node
statuses, historical recalculation without mutation, descendant failures/excused
outcomes, all-excused continuity, and exclusion of today's incomplete descendants.
`npx tsc --noEmit` and ESLint on the three changed code/test files pass.

On the next APK, verify the explanation sheet and a completed historical day
containing a done root with a failed/excused descendant. Both streaks must respect
every stored node. Today's status changes must not alter the counters before day
rollover. The agent did not build or launch the application. The pre-existing
deletion of `src/utils/recurrence.ts` was preserved.

## Implemented

- Independent Daily types, repository, application service, store, and status rules.
- Weekly recurrence with an explicit Monday anchor and N-week interval; monthly
  recurrence with last-day fallback. Creation defaults to today and all weekdays.
- Nested subtask editing and independent dated task trees.
- Today-effective text/tree edits and logical deletion; schedule changes remain
  tomorrow-effective. Missing historical dates reconstruct from retained revisions.
- Unmarked past outcomes resolve to failure. Explicit excused outcomes survive
  rollover. Future navigation never creates occurrence rows.
- Weekly/monthly calendar navigation, date outcome markers, all-template management,
  today-only status operations, loading/error feedback, and persisted outcomes.
- Perfect/Active streaks from all completed-day tree nodes, neutral empty days and
  all-excused Active continuity. Today's incomplete day is excluded.

## Changed application files

Existing files modified for Daily:

- `app/(tabs)/index.tsx`
- `src/components/daily/DailyTaskFormSheet.tsx`
- `src/components/daily/WeekCalendar.tsx`
- `src/components/daily/StreakSheet.tsx`
- `src/db/client.ts`
- `src/db/migrations.ts` — append-only v2; v1 unchanged
- `package.json` — add dependency-free Node test command

New files, including the earlier Phase 1 files:

- `eslint.config.js`
- `src/types/dailyTasks.ts`
- `src/db/dailyDatabase.ts`
- `src/db/migrate.ts`
- `src/services/dailyTaskRepository.ts`
- `src/services/dailyTaskService.ts`
- `src/services/dailyTasks.ts`
- `src/stores/dailyTasksStore.ts`
- `src/utils/dailyRecurrence.ts`
- `src/utils/dailyHistory.ts`
- `src/utils/dailyStatus.ts`
- `src/utils/dailyStreaks.ts`
- `src/components/daily/DailyTaskList.tsx`
- `tests/register.mjs`
- `tests/sqliteAdapter.mjs`
- `tests/dailyRecurrence.test.mjs`
- `tests/dailyHistory.test.mjs`
- `tests/dailyMigrations.test.mjs`
- `tests/dailyRepository.test.mjs`
- `tests/dailyService.test.mjs`
- `tests/dailyStatus.test.mjs`
- `tests/dailyStreaks.test.mjs`

Documentation updated: `PRODUCT_RULES.md`, `DAILY_TASKS.md`,
`DAILY_TASKS_IMPLEMENTATION_PLAN.md`, `DAILY_RECURRENCE_MODEL.md`, and ADR-002.
Documentation added: ADR-003 and this handoff.

Pre-existing developer changes in README, the Regular screen/stores, removal of
the old store/test data, and repository instructions were preserved. Regular
source logic, routes, and services were not modified by this implementation.

## Automated verification

Commands run with installed dependencies and Node 24.4.1:

```sh
npm test
npx --no-install tsc --noEmit
npm run lint
npx --no-install expo export --platform android --output-dir .expo/daily-smoke
git diff --check
```

- 43 tests pass, including real SQLite migrations, schema rollback, preservation
  of legacy Regular rows/cascades, database reopening, occurrence uniqueness,
  foreign keys, status restrictions, service transaction rollback, same-day
  edit/delete preservation, unmaterialized history, recurrence, and streak rules.
- TypeScript passes.
- ESLint on all Daily files, database files, new tests, and configuration passes.
- Full lint reports 6 pre-existing errors and 10 warnings in Regular/shared code
  (`AddTaskButton`, `Task`, `ActionSheet`, `Checkbox`, root layout, and `Notify`).
  These were not changed as part of Daily.
- Android JavaScript/Hermes bundle export succeeds. This is not an APK build or
  a device test. Artifacts are under ignored `.expo/daily-smoke`.
- `git diff --check` reports the pre-existing extra blank line at README EOF.
- Node emits module-type detection and experimental SQLite warnings during tests.
  Native Android SQLite behavior is not proven by the Node adapter.

## Database safety and recovery

Migration v2 introduces `daily_tasks`, `daily_task_revisions`, and
`daily_task_occurrences`. It leaves `tasks` and migration v1 unchanged. Migration
versions and DDL commit together; foreign key validation runs before commit.

Before upgrading an existing database containing `tasks`, the client uses the
native SQLite backup API to create `myd-before-daily-v2-<timestamp>.db` in Expo
SQLite's default database directory. This API includes committed WAL content;
copying only the live main file would not provide the same guarantee. A backup
failure stops initialization rather than proceeding without the backup.

If recovery is needed, stop application writes and retain copies of both the
current database and pre-migration backup outside the app sandbox first. Validate
the backup with SQLite integrity/foreign-key checks. Restoration requires a
deliberate maintenance operation with application connections closed (or a
controlled SQLite backup restore), followed by reopening and migration checks.
No automatic restore or database reset is implemented. The backup lives inside
app data and does not survive uninstalling/clearing the app. Native backup creation
and restoration still require verification on Android before relying on them.

## Android acceptance — developer runs the app

Launch only using the existing configured workflow:

```sh
bash scripts/dev-android.sh
```

The agent must not independently start Metro, invoke ADB to launch the app, or
replace the developer's launch workflow. No APK was built. There is no checked-in
EAS build configuration; APK packaging is a separate follow-up after device review.

First-session checks:

1. Open Regular Tasks: existing tasks, subtasks, statuses, editing and creation
   still work. Reopen the app and confirm existing data remains.
2. In Daily, create a task for every day with a note, two children and a nested
   child. Check keyboard, scrolling, save/cancel, and form validation.
3. Mark children separately. Identical child statuses propagate upward; mixed
   statuses produce `todo`. Manually marking the parent only changes descendants
   still in `todo`. Check `excused` and confirm `paused` is absent.
4. Reopen the app. Today's marks and notes must remain. Select tomorrow: outcomes
   must start independently in `todo`, with status controls disabled.
5. Edit the task via All Repetitions. Today's text/tree must update while existing
   marks and today's scheduling stay unchanged; the new schedule starts tomorrow.
6. Delete the repetition: today and tomorrow disappear, past dates remain visible.
7. Create a weekly task every two weeks using the reference Monday. Navigate
   active/inactive weeks and confirm selected weekdays match.
8. Create a monthly task for day 31. Preview April 30 and February 28/29 in future
   years; dates without a matching schedule must remain empty.

Longer-running checks:

- Leave scheduled tasks unmarked and keep the app closed past day end. On resume,
  missed historical dates must show failures, while `excused` remains unchanged.
- Verify neutral empty days and all-excused Active days preserve continuity; a
  completed day increments counts only after it ends.
- Verify foreground midnight refresh, Android back, rotation/small screens, device
  timezone changes, process termination, SQLite backup creation, and upgrade from
  an existing populated database. Do clock experiments only on disposable test data.

## Visual follow-up — shared components and week swipes

Approved by the developer after the first device review:

- Daily now renders the existing `TaskList`, `Task`, and animated `Checkbox`,
  with Regular's typography, indentation, and separators. `DailyTaskList` only
  adapts occurrence identities and callbacks; it owns no separate row styling.
- Daily uses the existing `AddTaskButton` with `context="daily"`.
- Optional disabled props prevent checkbox changes in historical/future views
  and during loading/writes. Regular callers retain the original enabled defaults.
- `TaskList` accepts an optional header and content-container style so Daily has
  one vertical scroll container instead of nesting task lists inside a ScrollView.
- `WeekCalendar` supports horizontal paged week swipes, keeping the weekday
  selected when changing weeks. Arrow navigation, month selection, date markers,
  and returning to today remain available. Three pages recenter after a week
  change; there is no fixed year-long navigation limit.

Files changed in this follow-up: `app/(tabs)/index.tsx`,
`src/components/TaskList.tsx`, `src/components/Task.tsx`, `src/ui/Checkbox.tsx`,
`src/components/AddTaskButton.tsx`, `src/components/daily/DailyTaskList.tsx`,
`src/components/daily/WeekCalendar.tsx`, and this document. No database, migration,
service, or store changes.

Verification: TypeScript and 29 existing tests pass. Focused lint on the Daily
screen, shared TaskList, Daily adapter, and calendar passes. Full lint retains the
same 6 existing errors and 10 warnings described above. Diff whitespace checks
pass for the changed UI files. The app was not launched by the agent.

Device review: compare Daily/Regular rows and add buttons; check nested task
indentation and checkbox animation; swipe repeatedly in both directions; choose
a month/date, return to today, and rotate the device; verify historical checkboxes
are disabled while task details still open; verify Regular controls remain enabled.

## Menu/form follow-up — inherited schedules and subtask actions

Approved after the shared-list follow-up:

- Daily now uses the existing `TaskSheet` and `ActionSheet` for root/subtask menus
  and forms. The menu shows the same status icons, note presentation and
  add-subtask/edit/delete buttons as Regular, with Daily's allowed statuses.
- `TaskFormFields` and `TaskFormActions` are shared by Regular and Daily. Regular
  retains its reset, validation, submit and close behavior. Shared Button accepts
  an optional disabled flag; existing callers retain the enabled default.
- Root forms include expandable recurrence controls; subtask forms only edit
  title/note and identify the root whose schedule they inherit.
- Adding/editing a subtask or removing its subtree now updates today's revision.
  Existing marks, historical content, siblings and the root schedule are preserved.
  Targeted operations also update a pending tomorrow revision transactionally.
- All Repetitions renders the pending tree using the existing Task component,
  allowing a newly added child to receive another child before tomorrow. Its
  status controls are read-only; daily status marks remain on the day screen.
- Legacy v2 deletions scheduled for tomorrow may still have today's recorded
  node. New deletions remove the node today as well.

Exact files changed in this follow-up:

- `app/(tabs)/index.tsx`
- `src/components/TaskSheet.tsx`
- `src/components/TaskFormFields.tsx` (new)
- `src/components/regular/RegularTaskFormSheet.tsx`
- `src/components/daily/DailyTaskFormSheet.tsx`
- `src/components/daily/DailyTaskList.tsx` (remove duplicate status labels)
- `src/ui/Button.tsx`
- `src/types/dailyTasks.ts`
- `src/utils/dailyTreeEditing.ts` (new; independent of Regular's tree store)
- `src/services/dailyTaskService.ts`
- `src/stores/dailyTasksStore.ts`
- `tests/dailyService.test.mjs`
- `docs/PRODUCT_RULES.md`
- `docs/features/DAILY_TASKS.md`
- `docs/decisions/ADR-003-DAILY-STATUS-AND-CALENDAR.md`
- This document

No SQL migrations or dependencies changed. TypeScript, focused lint, and 34 tests
pass. Five new service tests cover inherited schedules, preservation of sequential
pending edits, future subtree deletion, invalid operations, rollback and untouched
Regular rows. The agent did not launch the application.

Device checks using `bash scripts/dev-android.sh`:

1. Compare root/subtask menus in Regular and Daily: icons, notes, controls and
   actions should match, with the expected domain-specific statuses.
2. Create and edit a Regular task/subtask; verify keyboard focus, validation,
   prefilled values, cancel/save and unchanged existing data.
3. Create a Daily root, open its menu, and add a child. The child must immediately
   appear today, in All Repetitions and tomorrow's preview.
4. From All Repetitions, open that child, add a nested child, then edit its title
   and note. All edits must remain in the pending tree; the form must identify
   the inherited root schedule and expose no independent schedule controls.
5. Edit the root's schedule. The entire future tree follows it; today's tree and
   marks stay unchanged. Check expandable controls and scrolling with keyboard.
6. Delete a subtask that has descendants. Tomorrow loses only that subtree;
   siblings and the root remain. Today and past dates keep the old content.
7. Reopen the app, review today's marks and pending tree, then inspect a past
   date: structural/status writes must remain unavailable in history.

## Daily screen refactor — store orchestration and presentation components

Approved by the developer after reviewing the file-by-file plan. The screen now
contains local visibility/selection state, short `handle…` callbacks and component
composition. Domain selectors, form preparation, save/delete dispatch, status
validation/toggling, calendar markers and foreground observation live in the
Daily store. Persistence remains behind the existing service/repository boundary.

Three presentation components were extracted without changing their appearance:

- `DailyTemplatesList`: pending repetition trees, schedules and deletion triggers;
  it continues using the shared Task component.
- `DailyDayHeader`: selected date, completion count, read-only notice and empty day.
- `DailyTaskSheet`: Daily configuration of the shared TaskSheet, including notices
  and action availability.

The form receives prepared data and retains its local draft and closing animation.
Form errors propagate to it; status/delete errors remain in store state. Current
and pending tree selection, inherited schedules and effective dates are unchanged.

Files changed in this refactor:

- `app/(tabs)/index.tsx`
- `src/stores/dailyTasksStore.ts`
- `src/types/dailyTasks.ts`
- `src/components/daily/DailyTaskFormSheet.tsx`
- `src/components/daily/DailyTemplatesList.tsx` (new)
- `src/components/daily/DailyDayHeader.tsx` (new)
- `src/components/daily/DailyTaskSheet.tsx` (new)
- `tests/dailyTasksStore.test.mjs` (new)
- This document

Earlier uncommitted UI/prop naming changes were preserved. This refactor does not
modify Regular, services, repositories, schema, migrations, or dependencies.

Verification: `npm test` passes 43 tests, including 9 new store tests. TypeScript,
focused lint and diff whitespace checks pass. Full lint reports 6 existing errors
and 9 warnings in previously identified shared/Regular files. Store tests inject
the service, clock and foreground event source; native modules load on demand.
Tests cover today versus pending content, deleted-node action availability,
form routing, allowed statuses, error propagation, reactive selectors, day rollover,
and subscription/timer disposal, including a late subscription after screen blur.

The app was not launched by the agent. Using `bash scripts/dev-android.sh`, check
initial loading, day/template switching, calendar markers, current/pending task
menus, all three form modes, delete confirmation and animated form dismissal.
Background/resume and moving between tabs must reload correctly without duplicate
subscriptions. Native behavior and visual equivalence still require device review.

## Remaining limits after refactoring

Daily stores full JSON trees for immutable revisions and recorded occurrences.
For the intended personal app this keeps related status updates atomic. Historical
views and streak calculations currently read the complete Daily snapshot; large
multi-year datasets may eventually warrant indexed range loading and caching.

Device time is not trusted time. Stored date labels never move across timezone
changes. Persisted failures remain finalized after clock rollback, and structural
changes into already recorded later history are rejected.

Remaining work is developer device acceptance, addressing observed UX/native
issues, validating backup recovery, and then separately preparing an Android APK.

## APK follow-up: same-day Daily edits and settings cleanup

The developer approved replacing tomorrow-only structural changes with same-day
text/tree changes and deletion. Schedule changes still start tomorrow. Settings
uses the existing Button and ConfirmModal, with orchestration in settingsStore;
the screen contains only composition and handle-prefixed event handlers.

Migration v3 adds nullable `daily_tasks.stopped_from`; no tables or historical
rows are rebuilt. Current occurrence removal and logical template termination run
atomically. Regular cleanup is a separate single-statement cascading delete.

Automated coverage includes v2-to-v3 upgrade, same-day creation/edit/deletion,
retained historical revisions and virtual history, existing statuses, future
schedule edits, unscheduled days, atomic rollback, bulk cleanup, streak preservation,
Regular isolation, cancellation, duplicate confirmation prevention and retry.

On the phone after installing the next APK over the current app:

1. Add a Daily child and nested child today; edit their text immediately and restart.
2. Delete a child with descendants: the root and siblings stay today and tomorrow.
3. Delete a root: its complete tree disappears today, tomorrow and All Repetitions;
   prior days retain the full historical tree and statuses.
4. Change a root schedule: today's scheduling stays intact, tomorrow uses the change.
5. Cancel both Settings confirmations and verify no changes. Confirm Regular cleanup
   on disposable tasks; Daily must remain unchanged.
6. Confirm Daily cleanup: today, future and All Repetitions become empty, while past
   days and streak results remain. Restart to verify persistence.

The agent does not build, install or launch the app; final native acceptance belongs
to the developer. Existing app.json release-version changes are preserved.

Verification outcome: `npx tsc --noEmit` passes; `npm test` passes all 55 tests;
ESLint on the changed application files passes. Full `npm run lint` still reports
the existing 6 errors and 10 warnings in shared UI/root-layout code. `git diff
--check` passes. Native behavior has not been checked by the agent.

Exact files changed in this milestone:

- `app/(tabs)/settings.tsx`
- `src/stores/settingsStore.ts` (new)
- `src/stores/dailyTasksStore.ts`
- `src/stores/regularTasksStore.ts`
- `src/services/dailyTaskService.ts`
- `src/services/dailyTaskRepository.ts`
- `src/services/tasks.ts`
- `src/db/migrations.ts` (new forward migration v3)
- `src/types/dailyTasks.ts`
- `src/components/daily/DailyTaskFormSheet.tsx`
- `src/components/daily/DailyTaskSheet.tsx`
- `tests/dailyService.test.mjs`
- `tests/dailyMigrations.test.mjs`
- `tests/dailyTasksStore.test.mjs`
- `tests/taskCleanup.test.mjs` (new)
- `docs/PRODUCT_RULES.md`
- `docs/features/DAILY_TASKS.md`
- `docs/features/DAILY_TASKS_IMPLEMENTATION_PLAN.md`
- `docs/features/DAILY_TASKS_VERIFICATION.md`
- `docs/decisions/ADR-002-DAILY-HISTORY.md`
- `docs/decisions/ADR-003-DAILY-STATUS-AND-CALENDAR.md`

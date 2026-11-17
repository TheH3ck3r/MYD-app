# Daily Tasks — implementation milestones for Codex

**Status:** Proposed roadmap, not implementation authorization. Each phase needs explicit developer approval before Codex edits application code.

**Execution update:** Phase 1 was approved and implemented separately. The developer
subsequently explicitly authorized completing the entire Daily implementation with
implementation freedom, preserving Regular, and answered the remaining product
questions. Phases 2–5 are implemented; Phase 6 automated verification is recorded
in `DAILY_TASKS_VERIFICATION.md`. Android device acceptance and an APK build remain
pending. The original gates below describe the planning sequence, not additional
approval requests for that authorized work.

## Phase 0 — Repo inspection, test baseline, data safety (read-only)

- Read `AGENTS.md`, product rules, feature spec, ADRs, and relevant source files.
- Inspect `src/db/client.ts`, `src/db/migrations.ts`, `src/types/tasks.ts`, `src/utils/recurrence.ts`, `app/(tabs)/index.tsx`, existing Daily UI, and the Regular Tasks data flow.
- Inspect current Git changes; determine whether an existing `AGENTS.md` or related docs need merging.
- Run the existing non-destructive available checks and record baseline results; do not install dependencies without approval.
- Propose migration tracking strategy and DB backup/recovery approach.

**Gate:** Developer approves the proposed design and baseline report. No code changes yet.

## Phase 1 — Recurrence model and pure date functions

- Add Daily-specific schedule types, weekly interval and anchor, monthly day 1–31.
- Add pure date matching and monthly fallback logic.
- Write tests for weekdays, N-week boundaries, leap years, month ends, and year boundaries.
- Keep Regular recurrence behavior intact.

**Acceptance:** Date matching is deterministic and all recurrence tests pass.

## Phase 2 — Safe SQLite migration and Daily persistence

- Introduce version-tracked migrations after inspecting existing runner; preserve v1 and all existing data.
- Create Daily-specific tables, constraints, indexes, and revision effective dates after design approval.
- Add services for schedule lookup and dated occurrence storage; use transactions for status/tree updates.
- Validate uniqueness, foreign keys, deletion preservation, and reopening of DB.

**Acceptance:** Old Regular data persists; new Daily data survives app restart; repeat migration application is safe.

## Phase 3 — Daily store and occurrence reconciliation

- Separate MobX store and domain logic from Regular Tasks.
- Load scheduled tasks by selected date; reconcile missing historical occurrences as failures.
- Ensure same-day isolation, atomic persistence, and sensible loading/error handling.
- Keep explicit `OPEN` parent/child behavior out of scope until approved.

**Acceptance:** Date switch shows correct, independent outcomes; closed-app backlog yields correct historical failures.

## Phase 4 — Create/edit/delete UI and nested subtasks

- Connect existing Daily UI, form sheet, date picker, and calendar to Daily store.
- Implement weekly/monthly recurrence form validation and revisions taking effect tomorrow.
- Preserve task history across edits/deletion.
- **Before Daily subtask status implementation:** resolve and document status propagation and aggregation rules.

**Acceptance:** All CRUD, recurrence and history scenarios in the feature spec pass on Android.

## Phase 5 — Streak calculations and presentation

- Implement Perfect and Active from finalized dated root outcomes.
- Respect all-excused neutral Active days and no background timer dependency.
- **Before streak calculation is finalized:** resolve empty-day behavior and mixed-subtask root outcomes.
- Remove hardcoded streak placeholders from the Daily screen.

**Acceptance:** Streak test matrix passes, including app-closed days and excused days.

## Phase 6 — Quality, UX and APK readiness

- Verify TypeScript/lint/tests; manually validate Android scenarios.
- Review local data compatibility, errors, empty screens, and performance.
- Document reproducible Android APK build instructions using the actual Expo/project configuration, without claiming a build occurred unless it did.

**Acceptance:** Device validation and build steps are documented; no data loss or Regular Tasks regressions.

## Required output for each phase

- What exists already vs what is being implemented.
- Approved, narrowly scoped file-change plan.
- Tests executed and outcomes.
- Risks and unresolved decisions.
- Updated documentation for any approved change in behavior.

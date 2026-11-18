# Daily Tasks — feature specification

**Status:** Approved product requirements; Android device acceptance pending.
**Implementation:** Daily persistence, scheduling, history, status operations, calendar UI,
and streaks are implemented. Node integration tests and Android bundle export pass;
device acceptance is pending. See `DAILY_TASKS_VERIFICATION.md`.

## Goal

On launch the user sees today's scheduled recurring tasks and two streak indicators. The user can mark tasks, open a mini-calendar to inspect past dates, create/edit/delete recurrence templates, and review honest dated results.

## 1. Create and schedule

- Open an add-task sheet; enter title (required) and note/comment (optional), similar to Regular Tasks.
- Create nested subtasks for a recurring parent task.
- The root and all nested subtasks share one schedule. Only the root form exposes
  schedule controls; subtask forms show the root whose schedule they inherit.
- Daily and Regular reuse `TaskSheet`, `ActionSheet`, title/note fields, and form
  action buttons. The Daily menu offers the same add-subtask/edit/delete actions,
  with `excused` instead of `paused`. History is read-only.
- Choose one schedule type:
  - **Weekly:** one or more selected weekdays; repeats every `N` weeks where `N` is a positive integer. `N=1` = every week. Anchor the recurrence to a defined reference week/start date so it is deterministic.
  - **Monthly:** choose a calendar day 1–31, repeated every month. Use `min(requestedDay, daysInMonth)` for missing dates.
- A task appears only on dates matching its active schedule.
- The existing `src/types/tasks.ts` `Recurrence` type only supports `daily`/`weekly` weekdays at the time of audit; it is **not** the final contract for this feature.

### Scheduling examples

| Template              | Scheduled dates                                            |
| --------------------- | ---------------------------------------------------------- |
| Wake before 9         | Every weekday selected, typically all seven                |
| Gym                   | Monday and Thursday every week                             |
| Gym alternating weeks | Monday and Thursday every 2 weeks, relative to anchor week |
| Pay bills             | 31st of each month; April 30, February 28/29               |

## 2. Occurrence isolation

- A **template** is a recurrence definition, not a single completion state.
- An **occurrence** is the scheduled appearance on one local date.
- An occurrence's root status and subtask statuses are independent from every other date.
- Completing a gym subtask on Monday does not mark it complete on Thursday.
- Never use the template's mutable current status as the historical status for all dates.
- Do not create future occurrence rows without a bounded need; compute future schedule from recurrence definitions.

## 3. Status and end-of-day outcome

Daily statuses: `todo`, `done`, `failed`, `excused`. `paused` is not a Daily Task status.

- `todo`: not yet marked on a current/future scheduled date.
- `done`: completed.
- `failed`: failed or unmarked at the end of its scheduled calendar date.
- `excused`: intentionally skipped for a valid reason; not a failure.
- At local day rollover, unmarked tasks from earlier scheduled dates must resolve to `failed`, even after the app was not opened.
- Viewing past dates in the mini-calendar must show consistent persisted or deterministically reconciled results; merely forgetting to create rows must never hide a historical failure.
- When a task is explicitly `excused`, it must not be auto-marked `failed` on rollover.

### Approved Daily subtask status propagation

The developer requested the same behavior as Regular's `applyDown` and `aggregate`,
implemented separately for Daily:

| Operation                                | Result                                                 |
| ---------------------------------------- | ------------------------------------------------------ |
| Manual node status                       | Change that node and only descendants currently `todo` |
| All direct children have the same status | Ancestor adopts that status                            |
| Direct children have mixed statuses      | Ancestor becomes `todo`                                |
| Parent has no children                   | Retain its own status                                  |

The rule propagates up through ancestors. Already marked descendants are preserved,
even after a manual parent change. Root outcomes determine streaks. Mixed `done`
and `excused` children therefore produce `todo`, which resolves to `failed` after
the day ends unless the root is explicitly marked. Daily does not import Regular's
tree store and rejects `paused`.

## 4. History via mini-calendar

- The mini-calendar selects a date.
- The list reflects templates scheduled **on that date**, using the revision effective at that time.
- Show each root task's recorded/resolved outcome and its corresponding subtask statuses.
- Historical outcomes and historical task content remain stable after later edits.
- Future dates should not be treated as failed merely because a row has not been created.

## 5. Edit recurrence template

- Editable content includes title, note, schedule, and subtask tree.
- Title/note and tree edits apply **today**; schedule changes apply **tomorrow**.
- Preserve today's existing node statuses; new nodes start as `todo`.
- Keep historical revisions so that dates without stored occurrence rows can still be reconstructed correctly.
- Past recorded occurrences and virtual historical days retain their original trees.
- The selected node's edit form changes that node's title and note. Root editing
  also permits changing the schedule for the entire tree. Changing one node must
  preserve other edits, including a pending schedule change for tomorrow.
- New nested subtasks are available today immediately after saving. All Repetitions
  also supports editing tasks not scheduled today, without creating an unscheduled occurrence.

## 6. Delete recurrence template

- Stop creating/displaying future scheduled occurrences after deletion takes effect.
- Preserve all past dated occurrences, including failures and excused days.
- Keep the revisions and necessary metadata to reconstruct historical scheduled days never materialized while the app was closed.
- Use logical deletion/effective end date rather than deleting historical rows via cascade.
- Deletion takes effect today and removes today's stored occurrence, while retaining
  all earlier history. Tasks created today can also be deleted today.
- Deleting a subtask removes that node and its descendants today and on future dates,
  without deleting the root, changing its schedule, or removing siblings. The
  confirmation distinguishes deleting a repetition from deleting a subtask.
- Settings bulk deletion uses ConfirmModal, stops every active repetition today
  in one transaction, and preserves past history and streak results. Regular bulk
  deletion is a separate domain operation.

## 7. Streak calculations

Streaks consider **Daily Tasks only**, not Regular Tasks. They should operate on root scheduled occurrences, not count children as extra independent scheduled tasks.

| Completed day condition                       | Perfect      | Active                     |
| --------------------------------------------- | ------------ | -------------------------- |
| All root tasks `done`                         | +1           | +1                         |
| Mix of `done` and `excused`, no failures      | Reset        | +1                         |
| All root tasks `excused`                      | Reset        | Neutral (retain count, +0) |
| Any root task `failed` or unmarked at day end | Reset        | Reset                      |
| No root tasks scheduled                       | Neutral (+0) | Neutral (+0)               |

- The current incomplete day should not be mistaken for an ended failed day.
- A neutral Active day bridges streak continuity: if a successful day follows, the count resumes from its previous value.
- Mixed-status subtask behavior follows the approved propagation table above.

## 8. Data integrity and acceptance scenarios

1. Weekly selected weekdays show only on scheduled weekdays, including across year boundaries.
2. Biweekly recurrence respects its anchor week; no drift when the app remains closed.
3. Monthly 31st appears on February 28/29 and on April 30.
4. Marking one occurrence does not modify an earlier/later occurrence or its subtasks.
5. Editing title, note, schedule, or tree today preserves today's and historical appearance; future days use the new revision.
6. Deleting a template leaves prior dated history accessible; no new future appearances.
7. A scheduled day that passed while app was closed shows unmarked tasks as `failed`.
8. `excused` is preserved over midnight; `paused` is rejected in Daily status operations.
9. Perfect/Active rules match the table, including all-excused neutral Active days.
10. Existing Regular Tasks behavior, database rows, and routes are unchanged.

## Related documents

- `docs/PRODUCT_RULES.md`
- `docs/decisions/ADR-001-SEPARATE-TASK-DOMAINS.md`
- `docs/decisions/ADR-002-DAILY-HISTORY.md`
- `docs/features/DAILY_TASKS_IMPLEMENTATION_PLAN.md`

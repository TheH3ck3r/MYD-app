# Daily recurrence model — Phase 1

## Scope

Implemented as standalone types and pure functions, without UI, storage, status
propagation, or streak integration. Existing Regular recurrence is unchanged.

- Types: `src/types/dailyTasks.ts`.
- Functions: `src/utils/dailyRecurrence.ts`.
- Tests: `tests/dailyRecurrence.test.mjs`.

## Calendar contract

`startDate` is a required inclusive local calendar date in `YYYY-MM-DD` format.
Dates must be real Gregorian dates in years 0001–9999. No current-date default
is provided by these functions.

Weekly schedules require `intervalWeeks` (a positive safe integer),
`daysOfWeek` (JavaScript numbering, Sunday = 0), and `anchorWeekStart`.
The anchor is explicitly the Monday of a reference week. Matching weeks are
separated by multiples of `intervalWeeks` from that week, including weeks before
the anchor when allowed by `startDate`. This representation is independent of
locale and does not select the scheduling start date for the user.

Monthly schedules require `dayOfMonth` from 1 to 31. Missing days fall back to
the last day of the month. Dates before `startDate` never match.

`validateDailySchedule` throws `RangeError` for invalid dates or schedule values.
`isDailyScheduledOn` validates both the schedule and queried date, and returns
whether the calendar date matches. Inputs are not mutated.

UTC date components are used only for calendar arithmetic, avoiding DST-dependent
day lengths. The functions neither convert timestamps to local dates nor decide
how Android timezone changes affect history.

## Subsequent approved integration

The complete Daily implementation defaults creation to today, permits an explicit
future start, and rejects empty weekday selections at the service/form boundary.
The pure matcher still returns false for an empty mathematical selection.
Status, timezone, and empty-day rules are recorded in ADR-003.

## Verification

With Node.js 24.4.1 and installed project dependencies:

```sh
node --experimental-strip-types --test tests/dailyRecurrence.test.mjs
npx --no-install tsc --noEmit
```

No test dependencies or package module-type changes are needed. Node may emit a
module-type detection warning while loading the TypeScript module.

There were no SQL migrations in Phase 1. Subsequent approved work introduced
migration v2; see `DAILY_TASKS_VERIFICATION.md` for current verification status.

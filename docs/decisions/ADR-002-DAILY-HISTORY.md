# ADR-002 — Immutable Daily Task history across edits and deletion

**Status:** Accepted; physical schema implemented in forward migration v2

## Behavioral decision

- Each scheduled date represents an independent occurrence with its own status and subtask statuses.
- Text/tree edits affect today onward; schedule changes affect tomorrow onward.
  This updates the original tomorrow-only rule after APK review; see ADR-003.
  Past occurrences remain immutable.
- Historical title, note, tree structure, and outcomes remain as they were for the date.
- Deletion stops future scheduling but retains historical occurrences and the schedule information needed to reconstruct past days when the app was closed.
- Deletion now also removes today's occurrence. Migration v3 adds `stopped_from`
  for same-day deletion while retaining v2 lifecycle metadata and history.

## Implemented storage model

- `daily_tasks`: stable template identity and lifecycle metadata.
- `daily_task_revisions`: effective-dated title, note, schedule, and subtask tree snapshot.
- `daily_task_occurrences`: one dated status/tree snapshot per task/date; unique `(task_id, local_date)`.

Migration v1 is unchanged. Migration v2 creates these tables with foreign keys
using `ON DELETE RESTRICT`, revision uniqueness by task/effective date, occurrence
uniqueness by task/local date, and an index on occurrence date. SQLite
`user_version` tracks migration completion in the same transaction as schema changes.
Existing databases receive a native SQLite backup before upgrading to v2.

Occurrence trees and revision trees are validated JSON snapshots. Root status is
also constrained by SQL. Missing historical occurrences resolve deterministically
from the effective revision with `todo` becoming `failed`; there is no dependency
on materializing every missed day. Existing recorded occurrences are finalized
transactionally on load. Future viewing creates no occurrence rows.

Daily operations use a serialized dedicated connection with foreign keys enabled,
so Regular queries cannot accidentally enter Daily transactions. State is published
only after the transaction commits. Device verification of the native adapter and
backup recovery is still required.

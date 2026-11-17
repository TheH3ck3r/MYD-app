# ADR-001 — Separate Regular and Daily business logic

**Status:** Accepted

## Context

Regular Tasks already have a recursive task tree and status-management logic (`src/stores/regularTasksStore.ts`, `src/stores/taskTreeStore.ts`). Reusing the same behavior for recurring Daily Tasks created confusing coupling. Daily Tasks additionally have dated occurrences, recurrence, `excused`, and streaks.

## Decision

- Implement Daily Tasks in a separate store/service/domain tree implementation.
- Keep existing Regular Tasks logic intact unless a separate task explicitly modifies it.
- Do not use `applyDown`/`aggregate` as a presumed Daily Task contract.
- Share only demonstrably domain-neutral presentation components and small pure helpers.

## Consequences

- Some duplication is acceptable in return for clear boundaries.
- Daily status propagation and aggregation must be specified and tested independently.
- UI components may remain shared if they do not embed Regular business rules.

# Working with Codex CLI in MYD-app

## Start here

Run Codex from the **repository root** after placing `AGENTS.md` at the repository root. Codex discovers applicable `AGENTS.md` instructions automatically; feature specifications in `docs/` should be referenced explicitly in task prompts.

Recommended first task (read-only):

```text
Read AGENTS.md, docs/PRODUCT_RULES.md,
docs/decisions/ADR-001-SEPARATE-TASK-DOMAINS.md,
docs/decisions/ADR-002-DAILY-HISTORY.md,
docs/features/DAILY_TASKS.md, and
docs/features/DAILY_TASKS_IMPLEMENTATION_PLAN.md.
Inspect the actual codebase and git status. Perform Phase 0 only.
Do not edit any files or install dependencies.
Report architecture, conflicts between existing code and spec,
open product decisions, migration risks, and a phased plan in Russian.
```

After reviewing the report, authorize exactly one phase:

```text
Implement Phase 1 from docs/features/DAILY_TASKS_IMPLEMENTATION_PLAN.md.
Before making changes, show the exact files you plan to modify,
proposed tests, and any assumptions. Wait for my approval.
Preserve Regular Tasks behavior and do not implement later phases.
```

## Practical safety checklist

- Use a Git branch or clean working tree; inspect diffs before accepting changes.
- Don't run `npm run reset-project`.
- Do not approve destructive migrations or database resets.
- Inspect `git diff` and `git diff --check` after each phase.
- Preserve a backup of real device data before testing schema migrations.
- Require real check results; separate untested assumptions from verified behavior.

## Maintenance

- Update product rules only after explicit agreement.
- Mark unresolved behavior `OPEN`, proposed design `PROPOSED`, and accepted behavior `APPROVED`/`Accepted`.
- Add scoped `AGENTS.md` files only when distinct subdirectories actually need extra guidance; root instructions already cover the repository.
- Existing docs from an earlier audit may coexist. Merge carefully instead of overwriting edited user documents.

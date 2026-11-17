# MYD-app — repository instructions for Codex

## Communication and ownership

- Speak to the developer in Russian. Explain architectural decisions, trade-offs, and review findings in Russian.
- Use English for source code, identifiers, code comments, filenames, and commit messages.
- The developer owns product decisions and implementation approval. Do not infer missing behavior as approved requirements.
- The initial release target is a personally installed Android APK, not a public or multi-user service.

## Read before working

1. Inspect the relevant source files and imports, rather than assuming the architecture from this document.
2. Read `docs/PRODUCT_RULES.md` and the relevant files in `docs/features/` and `docs/decisions/`.
3. Check the actual working tree with `git status --short`. Preserve all existing changes; never overwrite unrelated edits.
4. Before implementing a feature, identify what already exists, what is missing, and any conflicts between code and specification.
5. For work beyond a small localized fix, provide a concise plan, files to change, data migration impact, verification plan, and open questions **before editing code**. Wait for explicit developer approval of the plan.
6. If a requirement is listed as `OPEN` or conflicts with implementation, ask for a decision instead of inventing a rule. Continue with independent approved tasks where safe.

## Architecture boundaries

- Stack: TypeScript, React Native, Expo, Expo Router, NativeWind, MobX, and expo-sqlite.
- `app/`: navigation and screen composition.
- `src/components/`, `src/ui/`: presentation and genuinely reusable UI primitives.
- `src/stores/`: MobX state and interaction orchestration.
- `src/services/`: persistence-oriented application services.
- `src/db/`: SQLite connection, schema, and migrations.
- `src/types/`: domain and component types.
- `src/utils/`: pure, domain-independent utilities where appropriate.
- Do not execute SQL directly in React components.
- Prefer small, incremental changes. Avoid introducing dependencies or generic frameworks without a demonstrated need.

## Critical domain boundary: regular vs daily

- **Regular Tasks and Daily Tasks are separate business domains.** Keep their stores, services, status propagation, recurrence, and aggregation logic independent.
- Do **not** reuse `src/stores/taskTreeStore.ts` (`applyDown`, `aggregate`, `transformTree`) in Daily Tasks without a separate, explicitly approved decision. It belongs to the existing Regular Tasks flow.
- Do **not** introduce a `BaseTaskStore` or shared status engine only to eliminate duplication.
- Reuse only genuinely domain-neutral UI components (for example `ActionSheet`, buttons, modal shells) and independently verified pure utilities.
- Allowed statuses: Regular `todo | done | failed | paused`; Daily `todo | done | failed | excused`. Enforce allowed status sets at domain boundaries even though the existing `TaskStatus` union contains all five.
- Perfect/Active streak calculations apply **only** to Daily Tasks.

## Source of truth and implementation scope

- Product behavior: `docs/PRODUCT_RULES.md`.
- Daily feature specification: `docs/features/DAILY_TASKS.md`.
- Work breakdown, approval gates, acceptance tests: `docs/features/DAILY_TASKS_IMPLEMENTATION_PLAN.md`.
- Architecture decisions: `docs/decisions/`.
- If older docs conflict with these newer approved product rules, report the discrepancy and propose a documentation fix; do not silently reinterpret behavior.
- If asked to implement an entire feature, first propose the smallest cohesive milestone from the implementation plan. Never silently implement every phase in one large change.

## Data safety and SQLite

- Treat the existing on-device SQLite database as containing valuable user data. Never drop, reset, or overwrite it as a shortcut.
- Do not run `npm run reset-project`; its script may remove source directories.
- Do not rewrite migration version 1 to introduce new features. Inspect the migration runner and implement safe, forward-only, tracked migrations before schema changes.
- Check foreign-key behavior and indexes. Use transactions for multi-row/related writes and preserve atomicity of occurrence status/tree updates.
- Prevent duplicate daily occurrences for the same task and calendar day. Do not pre-create an unbounded number of future occurrences.
- Historical daily occurrences and old schedule revisions must remain available after edit or logical deletion.
- Be explicit about local calendar dates vs UTC timestamps and their impact on recurrence and history.
- Do not claim background tasks or midnight timers are reliable when the app is closed; historical dates must reconcile from persisted schedules.

## Code quality and verification

- Follow current TypeScript naming, import, and formatting patterns after inspecting actual files.
- Keep types accurate; avoid `any` and unsafe casts unless justified and documented.
- Avoid mixing MobX mutations with partly completed database writes. Prefer committing DB changes before publishing state, or use an explicitly designed rollback mechanism.
- Add meaningful tests for recurrence edges, immutable history, allowed statuses, and streak rules before/alongside feature changes when practical.
- Run only checks actually available in the repository (for example `npx tsc --noEmit`, `npm run lint`, applicable tests). Do not claim success when tools/dependencies are missing.
- Android behavior must be verified on a device/emulator by the developer if the agent cannot access one. Do not claim an APK was built without building it.

## Prohibited without explicit permission

- Destructive operations, `git reset --hard`, force pushes, deleting files unrelated to the task, clearing SQLite data, changing package managers, or broad dependency upgrades.
- Secrets in source files, commits, logs, or documentation.
- Unrequested refactors of Regular Tasks while developing Daily Tasks.
- Automatic commit or push unless explicitly requested.

## Required handoff after changes

Report in Russian:
1. What was implemented and how it satisfies acceptance criteria.
2. Exact modified files and any SQL migrations.
3. Commands/tests run and real outcomes (including failures or unrun checks).
4. Compatibility, data integrity, and Android risks.
5. Unresolved product questions and the next proposed milestone.

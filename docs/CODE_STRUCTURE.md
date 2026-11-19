# Component and asset ownership

## Components

`src/components/` contains presentation reused across screens: AddTaskButton,
ConfirmModal, Task, TaskList, TaskSheet, TaskFormFields and TopBar. Its index exports
only shared components. Screen-specific components are imported directly from
`src/components/daily/` or `src/components/regular/`.

RegularEmptyState replaces the former NoTasks component. Only Regular used it;
its unused Daily branch and context parameter were removed. Domain services,
status propagation, recurrence and database schema are unchanged.

Files changed for this organization:

- `app/(tabs)/tasks.tsx`
- `src/components/index.ts`
- `src/components/NoTasks.tsx` (removed)
- `src/components/regular/RegularEmptyState.tsx` (added)
- `assets/icons/index.ts`
- This document.

## Assets

The current release uses `assets/images/icon.png`, `adaptive-icon.png` and
`splash-icon.png` through app.json, plus `assets/branding/launch-wordmark.xml`
through withAndroidAppearance. Interface icon components remain in assets/icons.

Removed unused files after checking repository references:

- `assets/images/android-icon-background.png`
- `assets/images/android-icon-foreground.png`
- `assets/images/android-icon-monochrome.png`
- `assets/images/expo-logo.png`
- `assets/images/expo-badge.png`
- `assets/images/expo-badge-white.png`
- `assets/images/favicon.png`
- `assets/images/logo-glow.png`
- `assets/images/react-logo.png`
- `assets/images/react-logo@2x.png`
- `assets/images/react-logo@3x.png`
- `assets/images/tabIcons/home.png`
- `assets/images/tabIcons/home@2x.png`
- `assets/images/tabIcons/home@3x.png`
- `assets/images/tabIcons/explore.png`
- `assets/images/tabIcons/explore@2x.png`
- `assets/images/tabIcons/explore@3x.png`
- `assets/expo.icon/icon.json`
- `assets/expo.icon/Assets/grid.png`
- `assets/expo.icon/Assets/expo-symbol 2.svg`
- `assets/icons/ChevronIcon.tsx`
- `assets/icons/EditSquareIcon.tsx`

Replacement artwork is supplied as PNG at the three configured paths in
assets/images. The adaptive foreground and splash artwork use transparency; the
launcher background is configured separately as #121417. Existing foreground
padding is preserved without an additional native inset.

`assets/branding` currently contains only the required `launch-wordmark.xml`:
the native vector outlines for Make your dream. withAndroidAppearance copies it
into Android resources during prebuild. Do not delete this directory while that
reference remains. Optional SVG design sources are not required for the build.

## Local IDE settings

The existing .gitignore already excludes .idea. The following previously tracked
files were removed from the Git index while preserving their local copies:
`.idea/.gitignore`, `.idea/MYD-app.iml`, `.idea/deviceManager.xml`, `.idea/misc.xml`,
`.idea/modules.xml` and `.idea/vcs.xml`. The developer must commit these removals
to remove the directory from the repository's next revision. Earlier Git history
is preserved. No commit or push is performed by the agent.

# Personal Android APK releases

## Release identity

- Application ID: `com.mikel.mydapp` (keep unchanged for updates).
- First release: `1.0.0`, Android `versionCode: 1` in `app.json`.
- Default ABI: `arm64-v8a`, intended for the developer's Samsung Galaxy A57 5G
  running Android 16. Installation and native behavior must be verified on the phone.
- Release APKs embed the application bundle and do not require Expo Go or Metro.
- The first APK starts with an empty database, as approved by the developer.
  Existing Expo Go data is not transferred or modified.

## Local build setup

Windows PowerShell, the locked npm dependencies, Android SDK/NDK and a modern JDK
are required. On this machine the script uses Android Studio's bundled JDK 21;
the unrelated Java 8 executable on PATH is not used. SDK/JDK locations can be
overridden with `MYD_JAVA_HOME`, `ANDROID_HOME` or script arguments.

Development launch remains unchanged:

```sh
bash scripts/dev-android.sh
```

The release build commands do not install or launch the application:

```sh
npm run android:apk
```

This performs Android-only Expo prebuild, Gradle `assembleRelease`, signing and
APK verification. The project's package scripts are preserved even when Expo
prebuild tries to rewrite them. Generated `android/`, `.local/` and `artifacts/`
directories are excluded from Git. Gradle's download cache is in
`$env:USERPROFILE\.gradle-myd`, keeping native compiler paths shorter on Windows.
The first build needs network access and may download Gradle/Android components.
When `HTTP_PROXY`/`HTTPS_PROXY` identify an unauthenticated HTTP CONNECT proxy,
the build script forwards its host/port to Java. Authenticated proxy credentials
are deliberately not passed in command arguments. Java download timeouts are
increased for large native artifacts.

After a network-only failure, retry the unchanged generated project with
`npm run android:apk -- -SkipPrebuild`. This flag is not for normal new releases;
version changes require prebuild and cannot be combined with this flag.

## Android appearance verification

`plugins/withAndroidAppearance.js` preserves the launcher artwork while adding
an adaptive-icon inset. It also configures light navigation controls over the
dark application background and an inherited native splash theme. On Android 12
and newer, the splash shows the vector wordmark `Make your dream` below the logo;
older Android versions retain the dark splash without the native branding image.
The vector contains outlined Segoe UI glyphs and needs no runtime font download.
These native changes require prebuild and a new APK, rather than a Metro reload.

For the first update over version code 1, run in PowerShell:

```powershell
npm.cmd run android:apk -- -VersionName 1.0.1 -VersionCode 2
```

Install over the existing app without uninstalling it. Keep the original signing
key and application ID. If version code 2 has already been installed, choose a
higher version code instead.

On the phone, verify:

- System navigation in both gesture and three-button modes: dark background,
  readable controls, and no overlap with the app tabs.
- Daily and Regular add/edit sheets: title, multiline note and expanded Daily
  schedule remain reachable with the keyboard open; close/reopen animations work.
- The home-screen icon fits the launcher's mask. A launcher may cache the old icon;
  remove and re-add its shortcut if needed, without uninstalling the application.
- A cold launch shows the dark splash and `Make your dream`; warm launches may
  skip the system splash. Do not use Expo Go to judge native branding.
- Existing tasks and outcomes remain available after updating.

Device acceptance remains required; automated configuration checks do not verify
Samsung keyboard, launcher caching or native window behavior.

## Permanent signing key

Signing material is generated once with:

```sh
npm run android:signing
```

It creates a 3072-bit RSA PKCS12 keystore and random passwords under:

```text
.local/android/myd-release.keystore
.local/android/signing.json
```

The command refuses to overwrite either existing file. On this development machine
the key has already been generated: reuse it for every release. On a replacement
computer, restore these files before building; do not generate a replacement key
for the same installed app.

Passwords are stored in the local JSON file with restricted Windows file access,
never in app config, Gradle source, Git or build command arguments. The script
passes them through temporary process environment variables and restores the
environment afterward. Keep a secure, preferably encrypted backup of BOTH files
outside this computer; do not share their contents in logs or chat.

`plugins/withAndroidReleaseSigning.js` reproducibly configures release signing
after prebuild. Debug signing remains separate. Release tasks fail when signing
environment variables are missing; they do not fall back to the debug key.

## Artifacts and verification

Verified files are placed under `artifacts/apk/`:

```text
myd-1.0.0-v1.apk
myd-1.0.0-v1.sha256
myd-1.0.0-v1.json
```

The script verifies APK alignment (including 16 KB native library alignment),
application ID/version metadata, absence of the debuggable flag, APK signatures
and the signing certificate fingerprint against the configured keystore.
The JSON sidecar records public release metadata, ABI, APK SHA-256 and signing
certificate SHA-256. Keep it together with the APK and checksum.

## Installation on the phone

1. Copy the APK to the phone by your preferred method (for example USB).
2. Open the APK and allow installation from that source if Android requests it.
3. Install MYD. It is a separate app from Expo Go and starts with empty data.
4. Open it without Metro, then verify task creation, status changes and persistence
   after closing/reopening. Test Daily and Regular independently.

The agent does not automatically install or launch the APK. A successful build
does not establish that the release works on Android; phone acceptance is required.

## Updating without Google Play

Build a new APK with a higher version code and the SAME application ID/key:

```sh
npm run android:apk -- -VersionName 1.0.1 -VersionCode 2
```

These explicit arguments update the canonical Expo version fields in `app.json`.
Review and commit that config change with the corresponding release. `package.json`
contains the npm project version; Android release versions come from `app.json`.
The script refuses to overwrite an existing release APK or reuse a version code
already present in the local APK archive. Keep the release archive when moving
between computers, and continue increasing version codes.

Copy the new APK to the phone and choose the system's Update/Install action over
the existing MYD installation. Do not uninstall MYD or clear its storage first.
Normal package updates preserve app data; existing `myd.db` is reopened and any
forward migrations are applied. No schema/data changes were added for packaging.

The first update acceptance test is essential: create both Regular/Daily data in
version 1, install version 2 over it, then confirm titles, nested subtasks, marks
and dated history remain available. Future schema changes require additional
migration tests; an APK update is not a substitute for safe migration design.

Do not use an older APK as a database rollback strategy. Older application code
may not understand a newer schema; the migration runner rejects newer schema
versions rather than rewriting the database.

## Backup and future update features

The current pre-v2 database backup runs during the legacy schema upgrade only.
It is not a general export feature or a backup before every APK update, and it
lives inside app storage. Uninstalling or clearing MYD storage can remove it.

A future approved milestone can add user-controlled database export/import under
Settings, with a consistent SQLite backup including WAL, file validation and a
deliberate restore flow. A subsequent feature could check a private release page
and offer an APK download; Android would still confirm installation.

OTA is optional, not configured in this milestone. Expo Update can deliver
compatible JavaScript/assets, but changes to native dependencies or native config
still need a new signed APK. Persistent SQLite migrations would need to remain
compatible with update/recovery behavior before introducing OTA.

## Sources

- [Android app signing](https://developer.android.com/studio/publish/app-signing)
- [Android versioning](https://developer.android.com/studio/publish/versioning)
- [Expo local release builds](https://docs.expo.dev/guides/local-app-production/)
- [Expo APK distribution](https://docs.expo.dev/build-reference/apk/)
- [How Expo Update works](https://docs.expo.dev/eas-update/how-it-works/)

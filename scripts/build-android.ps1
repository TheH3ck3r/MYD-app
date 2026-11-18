param(
    [string]$JavaDirectory,
    [string]$SdkDirectory,
    [ValidatePattern('^[a-z0-9_,\-]+$')][string]$Architectures = 'arm64-v8a',
    [ValidateRange(0, 2100000000)][int]$VersionCode = 0,
    [string]$VersionName,
    [switch]$SkipPrebuild
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'android-release-common.ps1')

$projectDirectory = Split-Path -Parent $PSScriptRoot
$credentialsPath = Join-Path $projectDirectory '.local\android\signing.json'
if (!(Test-Path -LiteralPath $credentialsPath)) { throw 'Run npm run android:signing once, or restore the original signing material.' }
$credentials = Get-Content -Raw -LiteralPath $credentialsPath | ConvertFrom-Json
$keystorePath = Join-Path (Split-Path -Parent $credentialsPath) $credentials.keystoreFile
if (!(Test-Path -LiteralPath $keystorePath)) { throw 'The original release keystore is missing. Restore it; do not create a new one.' }

$resolvedJava = Get-MydJavaDirectory -JavaDirectory $JavaDirectory
$resolvedSdk = Get-MydSdkDirectory -SdkDirectory $SdkDirectory
$buildTools = Get-ChildItem -LiteralPath (Join-Path $resolvedSdk 'build-tools') -Directory | Where-Object { $_.Name -match '^\d+\.\d+\.\d+$' } | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
if (!$buildTools) { throw 'Stable Android build-tools are required to package and verify the APK.' }
$aapt2Path = Join-Path $buildTools.FullName 'aapt2.exe'
if (!(Test-Path -LiteralPath $aapt2Path)) { throw 'AAPT2 was not found in the selected Android build-tools.' }
$configPath = Join-Path $projectDirectory 'app.json'
$config = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json
if ($SkipPrebuild -and ($VersionCode -gt 0 -or $VersionName)) { throw 'Version changes require prebuild. Do not combine -SkipPrebuild with version arguments.' }
if ($config.expo.android.package -ne 'com.mikel.mydapp') { throw 'Changing the Android application ID prevents updates of the installed MYD app.' }
if ($VersionCode -gt 0) {
    if ($VersionCode -lt $config.expo.android.versionCode) { throw 'VersionCode must not go backward.' }
    $config.expo.android.versionCode = $VersionCode
}
if ($VersionName) { $config.expo.version = $VersionName }
if ($config.expo.version -notmatch '^\d+\.\d+\.\d+$') { throw 'Use a numeric release version such as 1.0.0.' }
if ($config.expo.android.versionCode -lt 1) { throw 'Android versionCode must be a positive integer.' }

$artifactDirectory = Join-Path $projectDirectory 'artifacts\apk'
$artifactName = 'myd-{0}-v{1}' -f $config.expo.version, $config.expo.android.versionCode
$artifactPath = Join-Path $artifactDirectory ($artifactName + '.apk')
if (Test-Path -LiteralPath $artifactPath) { throw 'This release APK already exists. Preserve it and use a higher -VersionCode for the next release.' }
if (Test-Path -LiteralPath $artifactDirectory) {
    $existingReleases = Get-ChildItem -LiteralPath $artifactDirectory -File -Filter '*.apk'
    foreach ($existingRelease in $existingReleases) {
        if ($existingRelease.BaseName -match '-v(\d+)$' -and [long]$Matches[1] -ge $config.expo.android.versionCode) {
            throw 'A release with this or a higher versionCode already exists. Use a higher -VersionCode for every update.'
        }
    }
}

if ($VersionCode -gt 0 -or $VersionName) {
    Write-MydUtf8File -Path $configPath -Content (($config | ConvertTo-Json -Depth 30) + "`n")
}

$environmentValues = @{
    JAVA_HOME = $resolvedJava
    ANDROID_HOME = $resolvedSdk
    ANDROID_SDK_ROOT = $resolvedSdk
    GRADLE_USER_HOME = (Join-Path $env:USERPROFILE '.gradle-myd')
    CI = '1'
    NODE_ENV = 'production'
    MYD_ANDROID_KEYSTORE_FILE = $keystorePath
    MYD_ANDROID_KEYSTORE_PASSWORD = $credentials.storePassword
    MYD_ANDROID_KEY_ALIAS = $credentials.keyAlias
    MYD_ANDROID_KEY_PASSWORD = $credentials.keyPassword
}
$previousEnvironment = @{}
foreach ($name in $environmentValues.Keys) {
    $previousEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
    [Environment]::SetEnvironmentVariable($name, $environmentValues[$name], 'Process')
}

Push-Location $projectDirectory
try {
    $expoPath = Join-Path $projectDirectory 'node_modules\.bin\expo.cmd'
    if (!(Test-Path -LiteralPath $expoPath)) { throw 'Install the locked npm dependencies before building.' }
    # Prebuild may rewrite package scripts; keep this project's development workflow.
    $packagePath = Join-Path $projectDirectory 'package.json'
    $packageBefore = [System.IO.File]::ReadAllText($packagePath)
    if (!$SkipPrebuild) { try {
        & $expoPath prebuild --platform android --no-install
        if ($LASTEXITCODE -ne 0) { throw 'Expo Android prebuild failed.' }
    } finally { Write-MydUtf8File -Path $packagePath -Content $packageBefore } }

    $androidDirectory = Join-Path $projectDirectory 'android'
    if (!(Test-Path -LiteralPath (Join-Path $androidDirectory 'gradlew.bat'))) { throw 'Android project was not generated. Run the build without -SkipPrebuild.' }
    $sdkForProperties = $resolvedSdk.Replace('\', '/')
    Write-MydUtf8File -Path (Join-Path $androidDirectory 'local.properties') -Content ("sdk.dir=$sdkForProperties`n")
    Push-Location $androidDirectory
    try {
        $gradleArguments = @(':app:assembleRelease', ('-PreactNativeArchitectures=' + $Architectures), ('-Pandroid.aapt2FromMavenOverride=' + $aapt2Path), '-Dorg.gradle.internal.http.socketTimeout=180000', '-Dorg.gradle.internal.http.connectionTimeout=60000', '--no-daemon', '--no-configuration-cache', '--console=plain', '--max-workers=2')
        $gradleArguments += @(Get-MydGradleProxyArguments)
        & '.\gradlew.bat' @gradleArguments
        if ($LASTEXITCODE -ne 0) { throw 'Android release build failed.' }
    } finally { Pop-Location }

    $apkPath = Join-Path $androidDirectory 'app\build\outputs\apk\release\app-release.apk'
    if (!(Test-Path -LiteralPath $apkPath)) { throw 'Gradle finished without the expected release APK.' }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $apkArchive = [System.IO.Compression.ZipFile]::OpenRead($apkPath)
    try {
        $embeddedBundle = $apkArchive.GetEntry('assets/index.android.bundle')
        if (!$embeddedBundle -or $embeddedBundle.Length -eq 0) { throw 'Release APK has no embedded application bundle and could depend on Metro.' }
    } finally { $apkArchive.Dispose() }
    $apksignerPath = Join-Path $buildTools.FullName 'apksigner.bat'
    & (Join-Path $buildTools.FullName 'zipalign.exe') -c -P 16 4 $apkPath
    if ($LASTEXITCODE -ne 0) { throw 'APK alignment verification failed (including 16 KB native library alignment).' }
    $badging = & (Join-Path $buildTools.FullName 'aapt.exe') dump badging $apkPath
    if ($LASTEXITCODE -ne 0) { throw 'Could not inspect APK package metadata.' }
    $packageMetadata = $badging | Where-Object { $_ -match '^package:' } | Select-Object -First 1
    $expectedPackage = "name='com.mikel.mydapp'"
    $expectedCode = "versionCode='$($config.expo.android.versionCode)'"
    $expectedVersion = "versionName='$($config.expo.version)'"
    if (!$packageMetadata -or !$packageMetadata.Contains($expectedPackage) -or !$packageMetadata.Contains($expectedCode) -or !$packageMetadata.Contains($expectedVersion)) {
        throw 'Built APK package/version does not match app.json.'
    }
    if ($badging | Where-Object { $_ -match '^application-debuggable' }) { throw 'A debuggable APK must not be published as a release.' }
    Write-Host $packageMetadata
    & $apksignerPath verify --verbose --print-certs $apkPath
    if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
    & (Join-Path $resolvedJava 'bin\keytool.exe') -exportcert -keystore $keystorePath -alias $credentials.keyAlias -storepass:env MYD_ANDROID_KEYSTORE_PASSWORD -file (Join-Path (Split-Path -Parent $credentialsPath) 'release-certificate.der') | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Could not read the release certificate.' }
    $expectedFingerprint = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path (Split-Path -Parent $credentialsPath) 'release-certificate.der')).Hash
    $certificateDetails = (& $apksignerPath verify --print-certs $apkPath) -join "`n"
    if ($LASTEXITCODE -ne 0 -or $certificateDetails -notmatch [regex]::Escape($expectedFingerprint)) { throw 'APK was not signed by the configured permanent release key.' }

    New-Item -ItemType Directory -Path $artifactDirectory -Force | Out-Null
    Copy-Item -LiteralPath $apkPath -Destination $artifactPath
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $artifactPath).Hash.ToLowerInvariant()
    Write-MydUtf8File -Path (Join-Path $artifactDirectory ($artifactName + '.sha256')) -Content ("$hash  $artifactName.apk`n")
    $releaseMetadata = [ordered]@{ applicationId = $config.expo.android.package; version = $config.expo.version; versionCode = $config.expo.android.versionCode; architectures = $Architectures; apkSha256 = $hash; signingCertificateSha256 = $expectedFingerprint.ToLowerInvariant(); builtAtUtc = [DateTime]::UtcNow.ToString('o') }
    Write-MydUtf8File -Path (Join-Path $artifactDirectory ($artifactName + '.json')) -Content (($releaseMetadata | ConvertTo-Json) + "`n")
    Write-Host ('Verified release APK: ' + $artifactPath)
    Write-Host ('SHA-256: ' + $hash)
    Write-Host 'No app was installed or launched. Install this APK manually; future updates must be installed over the existing app.'
} finally {
    Pop-Location
    foreach ($name in $previousEnvironment.Keys) {
        [Environment]::SetEnvironmentVariable($name, $previousEnvironment[$name], 'Process')
    }
}

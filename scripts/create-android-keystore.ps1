param([string]$JavaDirectory)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'android-release-common.ps1')

$projectDirectory = Split-Path -Parent $PSScriptRoot
$signingDirectory = Join-Path $projectDirectory '.local\android'
$credentialsPath = Join-Path $signingDirectory 'signing.json'
$keystorePath = Join-Path $signingDirectory 'myd-release.keystore'

if ((Test-Path -LiteralPath $credentialsPath) -or (Test-Path -LiteralPath $keystorePath)) {
    throw 'Signing material already exists. It will not be replaced. Keep the original key for all future updates.'
}

$resolvedJava = Get-MydJavaDirectory -JavaDirectory $JavaDirectory
$keytoolPath = Join-Path $resolvedJava 'bin\keytool.exe'
if (!(Test-Path -LiteralPath $keytoolPath)) { throw 'keytool.exe was not found in the selected JDK.' }

New-Item -ItemType Directory -Path $signingDirectory -Force | Out-Null
Set-MydPrivateDirectory -Directory $signingDirectory
$previousPassword = [Environment]::GetEnvironmentVariable('MYD_KEYTOOL_PASSWORD', 'Process')
try {
    $password = New-MydSigningPassword
    [Environment]::SetEnvironmentVariable('MYD_KEYTOOL_PASSWORD', $password, 'Process')
    & $keytoolPath -genkeypair -noprompt -keystore $keystorePath -storetype PKCS12 -alias 'myd-release' -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=MYD Personal Android App' -storepass:env MYD_KEYTOOL_PASSWORD -keypass:env MYD_KEYTOOL_PASSWORD
    if ($LASTEXITCODE -ne 0) { throw 'Release signing key creation failed. Inspect local signing files before retrying.' }
    $credentials = [ordered]@{ keyAlias = 'myd-release'; keystoreFile = 'myd-release.keystore'; storePassword = $password; keyPassword = $password }
    Write-MydUtf8File -Path $credentialsPath -Content (($credentials | ConvertTo-Json) + "`n")
} finally {
    [Environment]::SetEnvironmentVariable('MYD_KEYTOOL_PASSWORD', $previousPassword, 'Process')
    $password = $null
}

Write-Host 'Release signing material created in .local/android (excluded from Git and restricted to this Windows account).'
Write-Host 'Back up BOTH myd-release.keystore and signing.json securely outside this computer. Never regenerate this key for updates.'

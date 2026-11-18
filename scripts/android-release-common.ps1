Set-StrictMode -Version Latest

function Get-MydJavaDirectory {
    param([string]$JavaDirectory)
    $candidates = @($JavaDirectory, $env:MYD_JAVA_HOME, (Join-Path $env:ProgramFiles 'Android\Android Studio\jbr'), $env:JAVA_HOME)
    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path -LiteralPath (Join-Path $candidate 'bin\java.exe'))) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }
    throw 'A modern JDK is required. Set MYD_JAVA_HOME to the JDK directory (Android Studio jbr is supported).'
}

function Get-MydSdkDirectory {
    param([string]$SdkDirectory)
    $candidates = @($SdkDirectory, $env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, (Join-Path $env:LOCALAPPDATA 'Android\Sdk'))
    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path -LiteralPath (Join-Path $candidate 'platform-tools'))) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }
    throw 'Android SDK was not found. Set ANDROID_HOME or supply -SdkDirectory.'
}

function Set-MydPrivateDirectory {
    param([Parameter(Mandatory = $true)][string]$Directory)
    # Signing files are readable only by the current Windows account.
    $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent()
    $permission = '*' + $identity.User.Value + ':(OI)(CI)F'
    & icacls.exe $Directory '/inheritance:r' '/grant:r' $permission | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Could not restrict the signing directory permissions.' }
}

function New-MydSigningPassword {
    $bytes = New-Object byte[] 48
    $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $random.GetBytes($bytes) } finally { $random.Dispose() }
    return [Convert]::ToBase64String($bytes)
}

function Write-MydUtf8File {
    param([Parameter(Mandatory = $true)][string]$Path, [Parameter(Mandatory = $true)][string]$Content)
    [System.IO.File]::WriteAllText($Path, $Content, (New-Object System.Text.UTF8Encoding($false)))
}

function Get-MydGradleProxyArguments {
    $arguments = @()
    foreach ($protocol in @('http', 'https')) {
        $variableName = $protocol.ToUpperInvariant() + '_PROXY'
        $proxyValue = [Environment]::GetEnvironmentVariable($variableName, 'Process')
        if (!$proxyValue) { continue }
        $proxyUri = $null
        if (![Uri]::TryCreate($proxyValue, [UriKind]::Absolute, [ref]$proxyUri)) { throw 'HTTP_PROXY/HTTPS_PROXY is not a valid absolute proxy URL.' }
        if ($proxyUri.Scheme -notin @('http', 'https')) { throw 'For Gradle, HTTP_PROXY/HTTPS_PROXY must identify an HTTP CONNECT proxy.' }
        if ($proxyUri.UserInfo) { throw 'Authenticated proxy credentials must be configured privately in Java/Gradle; they will not be passed in command arguments.' }
        $arguments += '-D' + $protocol + '.proxyHost=' + $proxyUri.Host
        $arguments += '-D' + $protocol + '.proxyPort=' + $proxyUri.Port
    }
    return $arguments
}

# Deploy LeadLab backend to Render via CLI
# Prerequisites: Run once to log in (opens browser): .\scripts\render-deploy.ps1 -Login
# Then deploy: .\scripts\render-deploy.ps1
# Or from repo root: .\scripts\render-deploy.ps1 -Deploy

param(
    [switch]$Login,
    [switch]$Deploy,
    # Render `deploys create` expects the service ID (srv-...), not the display name.
    # Run: render services list -o text  to find your Web Service ID.
    [string]$ServiceId = "srv-d5oef54hg0os73fj4uvg"
)

$ErrorActionPreference = "Stop"
$cliDir = "$env:TEMP\render-cli"
$cliExe = Get-ChildItem -Path $cliDir -Filter "cli_*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $cliExe) {
    Write-Host "Downloading Render CLI..."
    $url = "https://github.com/render-oss/cli/releases/download/v2.13.0/cli_2.13.0_windows_amd64.zip"
    $zip = "$env:TEMP\render-cli.zip"
    Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
    Expand-Archive -Path $zip -DestinationPath $cliDir -Force
    $cliExe = Get-ChildItem -Path $cliDir -Filter "cli_*.exe" | Select-Object -First 1
}

$render = $cliExe.FullName
Set-Location $PSScriptRoot\..

if ($Login) {
    Write-Host "Opening Render login (browser)..."
    & $render login
    exit $LASTEXITCODE
}

# List services to get ID if needed
if ($Deploy) {
    Write-Host "Checking Render login / workspace..."
    & $render workspace current 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Render CLI is not logged in or workspace is not set. Run in order:"
        Write-Host "  1) & `"$render`" login"
        Write-Host "  2) & `"$render`" workspace set"
        Write-Host "  3) .\scripts\render-deploy.ps1 -Deploy"
        exit 1
    }
    Write-Host "Triggering deploy for service ID: $ServiceId"
    & $render deploys create $ServiceId --confirm
    exit $LASTEXITCODE
}

# Default: interactive
& $render deploys create --help
Write-Host ""
Write-Host "To log in first: .\scripts\render-deploy.ps1 -Login"
Write-Host "To deploy:       .\scripts\render-deploy.ps1 -Deploy"
Write-Host "Service ID:      $ServiceId (edit -ServiceId if different; use: render services list -o text)"

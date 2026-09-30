$ErrorActionPreference = "Stop"

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodeScript = Join-Path $Here "entry499-direct-upload.mjs"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host ""
  Write-Host "Node.js is required. Install Node.js 22+ first, then run this file again." -ForegroundColor Red
  exit 2
}

Write-Host ""
Write-Host "TrendOS Entry499 - Direct Upload (NO WRANGLER)" -ForegroundColor Cyan
Write-Host "Target Worker: trendos-ui"
Write-Host "This tool creates a new Worker VERSION only. It does NOT deploy/promote traffic."
Write-Host ""

& node $NodeScript --package $Here --dry-run
if ($LASTEXITCODE -ne 0) {
  throw "Local Entry499 qualification failed."
}

Write-Host ""
$AccountId = Read-Host "Cloudflare Account ID"
if ([string]::IsNullOrWhiteSpace($AccountId)) {
  throw "Account ID is required."
}

$SecureToken = Read-Host "Cloudflare API Token (Workers Scripts Write) - input is hidden" -AsSecureString
$Bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureToken)
try {
  $Token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Bstr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Bstr)
}

if ([string]::IsNullOrWhiteSpace($Token)) {
  throw "API Token is required."
}

Write-Host ""
Write-Host "Safety gate:" -ForegroundColor Yellow
Write-Host "- Worker: trendos-ui"
Write-Host "- Assets: Entry499 qualified package"
Write-Host "- Action: upload assets + CREATE VERSION only"
Write-Host "- No Wrangler"
Write-Host "- No deployment / no traffic promotion"
Write-Host "- No Secrets / Variables / D1 changes"
Write-Host ""
$Confirm = Read-Host "Type CREATE to continue"
if ($Confirm -cne "CREATE") {
  Write-Host "Cancelled. Nothing was uploaded." -ForegroundColor Yellow
  $Token = $null
  exit 0
}

$env:CLOUDFLARE_ACCOUNT_ID = $AccountId.Trim()
$env:CLOUDFLARE_API_TOKEN = $Token

try {
  Write-Host ""
  & node $NodeScript --package $Here
  if ($LASTEXITCODE -ne 0) {
    throw "Entry499 upload/version creation failed."
  }
} finally {
  Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
  Remove-Item Env:CLOUDFLARE_ACCOUNT_ID -ErrorAction SilentlyContinue
  $Token = $null
  $SecureToken = $null
}

Write-Host ""
Write-Host "Finished. Do NOT close this window until you copy the VERSION_ID shown above." -ForegroundColor Green

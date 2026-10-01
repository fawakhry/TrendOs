$ErrorActionPreference = "Stop"
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodeScript = Join-Path $Here "entry546-direct-upload.mjs"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host "Node.js 22+ is required." -ForegroundColor Red; exit 2 }
Write-Host ""
Write-Host "TrendOS Orders Refresh Recovery - Frontend VERSION Creator" -ForegroundColor Cyan
Write-Host "Target Worker: trendos-ui"
Write-Host "Qualified source: 98cc788f0f1cbde9e2404feb1a0c7ca6ad9f2051"
Write-Host "Creates a NEW VERSION only. Does NOT deploy/promote traffic."
& node $NodeScript --package $Here --dry-run
if ($LASTEXITCODE -ne 0) { throw "Local qualification failed." }
$AccountId = Read-Host "Cloudflare Account ID"
if ([string]::IsNullOrWhiteSpace($AccountId)) { throw "Account ID is required." }
$SecureToken = Read-Host "Cloudflare API Token (Workers Scripts Write) - hidden input" -AsSecureString
$Bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureToken)
try { $Token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Bstr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Bstr) }
if ([string]::IsNullOrWhiteSpace($Token)) { throw "API Token is required." }
Write-Host ""
Write-Host "Safety gate:" -ForegroundColor Yellow
Write-Host "- Worker: trendos-ui only"
Write-Host "- Action: upload assets + CREATE VERSION only"
Write-Host "- No traffic promotion"
Write-Host "- No trendos-d1-api"
Write-Host "- No D1 / Secrets / Variables / Routes changes"
$Confirm = Read-Host "Type CREATE to continue"
if ($Confirm -cne "CREATE") { Write-Host "Cancelled. Nothing was uploaded."; $Token=$null; exit 0 }
$env:CLOUDFLARE_ACCOUNT_ID=$AccountId.Trim()
$env:CLOUDFLARE_API_TOKEN=$Token
try {
  & node $NodeScript --package $Here
  if ($LASTEXITCODE -ne 0) { throw "Upload/version creation failed." }
} finally {
  Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
  Remove-Item Env:CLOUDFLARE_ACCOUNT_ID -ErrorAction SilentlyContinue
  $Token=$null; $SecureToken=$null
}
Write-Host ""
Write-Host "STOP. Copy VERSION_ID and send it for review before promoting traffic." -ForegroundColor Green

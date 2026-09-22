# TrendOS T12 -- OWNER LOCAL REPLAY PROBE / ISOLATED TEST WORKER & TEST D1 ONLY.
# Not a production deploy/cutover. Does NOT toggle Cloudflare and does NOT write D1 directly.
# Replays EXACT same synthetic clientRequestId and literal payload as the one-shot CREATE script.
# REQUIRED: fresh read-only TEST D1 baseline (counter=2002, five table counts=1,
# reserved key linkage=1), enabled TEST version confirmed, disabled 6d422e92 relock ready.
# Do not use if baseline drifted, auth secret unknown, or immediate relock unavailable.
# Execute only ONE authenticated POST after owner confirmation. NEVER retry even on timeout.
# No secret literals in source, output or clipboard. Don't screenshot the secret-entry prompt.
$ErrorActionPreference = 'Stop'
$url = 'https://trendos-t12-synthetic-test.trendmall-contact.workers.dev/__t12/synthetic/order-create'
$key = 'cld1_1790071200000_T12SYNTHETICQUAL0001'
$body = [ordered]@{
  clientRequestId = $key
  customerMode = 'registered'
  customerName = 'SYNTHETIC TEST ONE'
  customerPhone = '01000000000'
  department = 'print'
  itemName = 'TEST LABEL ONE'
  qty = 1
} | ConvertTo-Json -Compress
Write-Host 'REPLAY ONLY: exact original fabricated request; isolated TEST Worker / TEST D1.'
Write-Host 'ABORT if latest TEST D1 baseline is not counter 2002 + five counts 1 + existing key linkage 1.'
Write-Host 'ABORT if TEST version or TEST D1 binding changed, or disabled 6d422e92 cannot be immediately restored.'
Write-Host 'Expected: HTTP 200, success true, syntheticOnly true, productionAuthorized false, stored false, idempotent true.'
Write-Host 'After one attempt, RELOCK TEST IMMEDIATELY regardless of HTTP status, timeout or outcome.'
$confirmation = Read-Host 'Only when TEST ONLY is briefly enabled AND immediate rollback is ready, type SEND-TEST-REPLAY-ONCE; otherwise press Enter to abort'
if ($confirmation -cne 'SEND-TEST-REPLAY-ONCE') {
  Write-Host 'ABORTED: no HTTP request was sent.'
  return
}
$secretSecure = $null
$secretPlain = $null
$ptr = [IntPtr]::Zero
$headers = $null
try {
  $secretSecure = Read-Host 'Enter owner-local TEST bearer (hidden; never paste into chat)' -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretSecure)
  $secretPlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  if ([string]::IsNullOrEmpty($secretPlain) -or $secretPlain.Length -lt 32 -or $secretPlain.Length -gt 256) {
    Write-Host 'ABORTED: invalid TEST bearer length; no HTTP request was sent.'
    return
  }
  $headers = @{ Authorization = ('Bearer ' + $secretPlain) }
  $status = $null
  $resultJson = $null
  Write-Host 'Sending exactly ONE identical synthetic TEST request. No automatic retries.'
  try {
    $r = Invoke-WebRequest -Uri $url -Method Post -ContentType 'application/json' -Headers $headers -Body $body -TimeoutSec 15 -UseBasicParsing -ErrorAction Stop
    $status = [int]$r.StatusCode
    $resultJson = [string]$r.Content
  } catch {
    if (-not $_.Exception.Response) {
      Write-Host 'OUTCOME UNKNOWN (network/timeout). DO NOT RETRY. RELOCK TEST NOW; inspect TEST D1 read-only.'
      return
    }
    $res = $_.Exception.Response
    $status = [int]$res.StatusCode
    $reader = $null
    try {
      $reader = New-Object System.IO.StreamReader($res.GetResponseStream())
      $resultJson = $reader.ReadToEnd()
    } catch {
      $resultJson = $null
    } finally {
      if ($reader) { $reader.Dispose() }
    }
  }
  Write-Host ('HTTP ' + $status)
  try {
    $o = $resultJson | ConvertFrom-Json -ErrorAction Stop
    $safe = [ordered]@{}
    foreach ($field in @('success','syntheticOnly','productionAuthorized','stored','idempotent','code','reason','retryAutomatically')) {
      if ($null -ne $o.PSObject.Properties[$field]) { $safe[$field] = $o.$field }
    }
    Write-Host ('SAFE RESULT: ' + ($safe | ConvertTo-Json -Compress))
    if ($status -eq 200 -and $o.success -eq $true -and
        $o.syntheticOnly -eq $true -and $o.productionAuthorized -eq $false -and
        $o.stored -eq $false -and $o.idempotent -eq $true) {
      Write-Host 'REPLAY RESPONSE MATCHED expected safe flags. DB counts STILL REQUIRE independent verification.'
    } else {
      Write-Host 'REPLAY RESPONSE DID NOT PASS. DO NOT RETRY; RELOCK TEST; reconcile TEST D1 read-only.'
    }
  } catch {
    Write-Host 'Response missing/invalid. DO NOT RETRY; RELOCK TEST; reconcile TEST D1 read-only.'
  }
} finally {
  if ($ptr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
  $ptr = [IntPtr]::Zero
  $secretSecure = $null
  $secretPlain = $null
  $headers = $null
  Write-Host 'RELOCK TEST NOW: publish verified disabled 6d422e92 at 100%, Settings false, independent public POST {} HTTP 423. Do not wait for chat.'
}

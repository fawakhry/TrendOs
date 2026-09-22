# TrendOS T12 -- OWNER LOCAL, isolated TEST D1/Worker ONLY.
# Source reviewed against t12-dashboard-singlefile-test-worker.js on 2026-09-22.
# Keep TEST Worker deployed DISABLED until database read-only preflight passes and
# you are immediately ready to re-lock. This script DOES NOT toggle Cloudflare.
# Contains NO bearer value. Run ONCE ONLY; NEVER retry on timeout/non-201/error.
# Type a confirmation at runtime before any HTTP call. Never screenshot the secret.
# Windows PowerShell 5.1 compatible; all source/payload text is ASCII.
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
Write-Host 'TEST-only Worker and D1. Expected preflight: TEST marker, counter 2001, all five counts 0.'
Write-Host 'STOP if the private TEST bearer is unknown, TEST database preflight failed, or you cannot immediately re-lock the TEST Worker.'
Write-Host ('One fabricated order key: ' + $key)
$confirmation = Read-Host 'When deployed TEST ONLY is temporarily enabled, type SEND-TEST-ONCE; otherwise press Enter to abort'
if ($confirmation -cne 'SEND-TEST-ONCE') {
  Write-Host 'ABORTED: no HTTP request was sent.'
  return
}
$secretSecure = $null
$secretPlain = $null
$ptr = [IntPtr]::Zero
$headers = $null
try {
  $secretSecure = Read-Host 'Enter owner-local TEST bearer secret (hidden; never paste into chat)' -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretSecure)
  $secretPlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  if ([string]::IsNullOrEmpty($secretPlain) -or $secretPlain.Length -lt 32 -or $secretPlain.Length -gt 256) {
    Write-Host 'ABORTED: invalid TEST secret length; no HTTP request was sent.'
    return
  }
  $headers = @{ Authorization = ('Bearer ' + $secretPlain) }
  Write-Host 'Sending exactly one request to isolated TEST Worker. No automatic retries.'
  try {
    $response = Invoke-WebRequest -Uri $url -Method Post -ContentType 'application/json' -Headers $headers -Body $body -TimeoutSec 15 -UseBasicParsing -ErrorAction Stop
    $status = [int]$response.StatusCode
    $resultJson = [string]$response.Content
  } catch {
    if ($_.Exception.Response) {
      $res = $_.Exception.Response
      $status = [int]$res.StatusCode
      $reader = $null
      try {
        $reader = New-Object System.IO.StreamReader($res.GetResponseStream())
        $resultJson = $reader.ReadToEnd()
      } finally {
        if ($reader) { $reader.Dispose() }
      }
    } else {
      Write-Host 'RESULT UNKNOWN: local/network/timeout error. DO NOT RETRY. RELOCK TEST NOW.'
      return
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
  } catch {
    Write-Host 'Response body unavailable/invalid. Do not retry.'
  }
  if ($status -eq 201) {
    Write-Host 'HTTP 201 received. Do NOT send another request; RELOCK TEST NOW, then read-only D1 reconcile.'
  } else {
    Write-Host 'Unexpected/non-201 HTTP result. DO NOT RETRY; RELOCK TEST NOW, then read-only D1 reconcile.'
  }
} finally {
  if ($ptr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
  $ptr = [IntPtr]::Zero
  $secretSecure = $null
  $secretPlain = $null
  $headers = $null
  [GC]::Collect()
  Write-Host 'RELOCK CHECK: TEST Settings flag false -> publish verified disabled TEST version -> external public POST {} must return HTTP 423.'
}

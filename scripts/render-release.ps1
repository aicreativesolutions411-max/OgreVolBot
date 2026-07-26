param(
  [switch]$IncludeWorkers,
  [string]$Commit = "",
  [int]$TimeoutMinutes = 20
)

# Deploy one completed release batch instead of rebuilding on every pushed commit.
# Default: web service only.
# Worker/runtime release: add -IncludeWorkers.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\render-release.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\render-release.ps1 -IncludeWorkers

$ErrorActionPreference = "Stop"
$apiKey = $env:RENDER_API_KEY
if (-not $apiKey) {
  Write-Host "FAIL  RENDER_API_KEY is not set."
  exit 1
}

$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $Commit) {
  $Commit = (git -C $repoRoot rev-parse HEAD).Trim()
}
if ($Commit -notmatch '^[0-9a-fA-F]{40}$') {
  Write-Host "FAIL  Commit must be a full 40-character Git SHA."
  exit 1
}

$dirty = @(git -C $repoRoot status --porcelain)
if ($dirty.Count -gt 0) {
  Write-Host "FAIL  Commit and push the intended tracked files before releasing."
  exit 1
}

git -C $repoRoot merge-base --is-ancestor $Commit origin/main 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "FAIL  Commit is not present on origin/main. Push it before releasing."
  exit 1
}

$headers = @{
  Authorization = "Bearer $apiKey"
  Accept = "application/json"
  "Content-Type" = "application/json"
}
$services = @(
  @{ Name = "web"; Id = "srv-d86q8gq8qa3s73fq1r60" }
)
if ($IncludeWorkers) {
  $services += @(
    @{ Name = "trade worker"; Id = "srv-d8f0vpc2m8qs73dmdmqg" },
    @{ Name = "wallet/data worker"; Id = "srv-d8hmit0jo6nc73cd4q60" }
  )
}

$pending = @()
foreach ($service in $services) {
  $recent = Invoke-RestMethod `
    -Uri "https://api.render.com/v1/services/$($service.Id)/deploys?limit=20" `
    -Headers $headers `
    -Method Get
  $live = @($recent | ForEach-Object { if ($_.deploy) { $_.deploy } else { $_ } } |
    Where-Object { $_.status -eq "live" } |
    Select-Object -First 1)

  if ($live.Count -gt 0 -and $live[0].commit.id -eq $Commit) {
    Write-Host ("SKIP  {0} is already live on {1}." -f $service.Name, $Commit.Substring(0, 8))
    continue
  }

  $body = @{ commitId = $Commit; clearCache = "do_not_clear" } | ConvertTo-Json
  $deploy = Invoke-RestMethod `
    -Uri "https://api.render.com/v1/services/$($service.Id)/deploys" `
    -Headers $headers `
    -Method Post `
    -Body $body
  Write-Host ("START {0} deploy {1} for {2}." -f $service.Name, $deploy.id, $Commit.Substring(0, 8))
  $pending += @{ Name = $service.Name; Id = $service.Id; DeployId = $deploy.id }
}

if ($pending.Count -eq 0) {
  Write-Host "PASS  Requested services are already live."
  exit 0
}

$deadline = (Get-Date).AddMinutes($TimeoutMinutes)
while ($pending.Count -gt 0 -and (Get-Date) -lt $deadline) {
  Start-Sleep -Seconds 10
  $remaining = @()
  foreach ($item in $pending) {
    $deploy = Invoke-RestMethod `
      -Uri "https://api.render.com/v1/services/$($item.Id)/deploys/$($item.DeployId)" `
      -Headers $headers `
      -Method Get
    if ($deploy.deploy) { $deploy = $deploy.deploy }

    if ($deploy.status -eq "live") {
      Write-Host ("LIVE  {0} on {1}." -f $item.Name, $Commit.Substring(0, 8))
    } elseif ($deploy.status -in @("build_failed", "update_failed", "canceled", "deactivated")) {
      Write-Host ("FAIL  {0} ended with status {1}." -f $item.Name, $deploy.status)
      exit 1
    } else {
      Write-Host ("WAIT  {0}: {1}" -f $item.Name, $deploy.status)
      $remaining += $item
    }
  }
  $pending = $remaining
}

if ($pending.Count -gt 0) {
  Write-Host "FAIL  Timed out waiting for Render."
  exit 1
}

Write-Host "PASS  Release is live."

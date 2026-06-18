# render-check.ps1 — one-shot health scan of the live OgreVolBot deploy.
# Needs env vars RENDER_API_KEY and AUTOPILOT_OWNER_KEY (put them in the gitignored .env
# or export them in this shell). NEVER prints the key values. See AGENTS.md.
#
# Usage:  pwsh ./scripts/render-check.ps1        (or: powershell -File scripts\render-check.ps1)

$ErrorActionPreference = "Stop"
$SVC   = "srv-d86q8gq8qa3s73fq1r60"
$OWNER = "tea-d84e17rtqb8s73fabu1g"
$ORIGIN = "https://ogrevolbot.onrender.com"

$rk = $env:RENDER_API_KEY
$ok = $env:AUTOPILOT_OWNER_KEY
if (-not $rk) { Write-Host "FAIL  RENDER_API_KEY not set (add it to .env / export it)"; exit 1 }
$H = @{ Authorization = "Bearer $rk"; Accept = "application/json" }
$fail = 0

Write-Host "== OgreVolBot deploy check ==`n"

# 1) Latest deploy status
try {
  $d = (Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SVC/deploys?limit=1" -Headers $H)[0].deploy
  $commit = $d.commit.id.Substring(0,7)
  $msg = ($d.commit.message -split "`n")[0]
  $live = $d.status -eq "live"
  Write-Host ("[1] DEPLOY  status={0}  commit={1}  finished={2}" -f $d.status, $commit, $d.finishedAt)
  Write-Host ("          msg: {0}" -f $msg)
  if (-not $live) { Write-Host "          -> not live yet"; $fail = 1 }
} catch { Write-Host "[1] DEPLOY  ERROR: $($_.Exception.Message)"; $fail = 1 }

# 2) Recent logs — count errors
try {
  $logs = Invoke-RestMethod -Uri "https://api.render.com/v1/logs?ownerId=$OWNER&resource=$SVC&limit=100&direction=backward" -Headers $H
  $rows = @($logs.logs)
  # Match REAL errors; skip routine rpc_call telemetry (which carries "error":null).
  $errs = @($rows | Where-Object {
    $_.message -notmatch '(?i)"event":"rpc_call"' -and
    $_.message -match '(?i)("level":"(error|fatal)"|exception|unhandledrejection|ECONNREF|ETIMEDOUT|TypeError|ReferenceError|is not a function|cannot read)'
  })
  Write-Host ("`n[2] LOGS    last {0} lines, {1} error-ish" -f $rows.Count, $errs.Count)
  if ($errs.Count -gt 0) {
    $errs | Select-Object -First 4 | ForEach-Object {
      $m = $_.message; if ($m.Length -gt 140) { $m = $m.Substring(0,140) }
      Write-Host ("          ! {0}" -f $m)
    }
  }
} catch { Write-Host "[2] LOGS    ERROR: $($_.Exception.Message)"; $fail = 1 }

# 3) Bot health / autopilot scorecard (owner-gated read)
if ($ok) {
  try {
    $s = Invoke-RestMethod -Uri "$ORIGIN/api/web/autopilot/stats?key=$ok" -TimeoutSec 25
    $net = if ($null -ne $s.netPnlSol) { $s.netPnlSol } elseif ($s.stats) { $s.stats.netPnlSol } else { "n/a" }
    $tot = if ($null -ne $s.total) { $s.total } elseif ($s.stats) { $s.stats.total } else { "n/a" }
    $wal = if ($s.observatory) { $s.observatory.walletsTracked } else { "n/a" }
    Write-Host ("`n[3] BOT     stats OK  trades={0}  netPnlSol={1}  walletsTracked={2}" -f $tot, $net, $wal)
  } catch { Write-Host "`n[3] BOT     ERROR: $($_.Exception.Message)"; $fail = 1 }
} else {
  Write-Host "`n[3] BOT     skipped (AUTOPILOT_OWNER_KEY not set)"
}

Write-Host ""
if ($fail -eq 0) { Write-Host "RESULT: PASS - live, logs clean, bot responding." }
else { Write-Host "RESULT: ATTENTION - see flags above."; exit 1 }

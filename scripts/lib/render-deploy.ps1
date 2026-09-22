# Render returns either a deploy directly or a { deploy, cursor } wrapper.
# Never treat a list response (for example, from a missing deploy ID) as one deploy.
function Resolve-RenderDeploy {
  param(
    [Parameter(Mandatory = $true)]$Response,
    [string]$ExpectedId = "",
    [string]$ExpectedCommit = ""
  )
  if (@($Response).Count -ne 1) { throw "Expected one Render deploy, not a list." }
  $deploy = if ($Response.deploy) { $Response.deploy } else { $Response }
  if (@($deploy).Count -ne 1 -or $deploy.id -notmatch '^dep-[a-z0-9]+$') {
    throw "Render response is missing a valid deploy ID."
  }
  if ($deploy.commit.id -notmatch '^[a-fA-F0-9]{40}$') {
    throw "Render response is missing a valid commit SHA."
  }
  if (-not $deploy.status -or $deploy.status -is [array]) {
    throw "Render response is missing one deploy status."
  }
  if ($ExpectedId -and $deploy.id -ne $ExpectedId) {
    throw "Render returned a different deploy ID."
  }
  if ($ExpectedCommit -and $deploy.commit.id -ne $ExpectedCommit) {
    throw "Render deploy does not match the requested commit."
  }
  return $deploy
}

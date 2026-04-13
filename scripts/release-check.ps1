param(
  [switch]$AllowDirty
)

function Fail([string]$Message) {
  Write-Host ""
  Write-Host "Release check failed: $Message" -ForegroundColor Red
  Write-Host ""
  exit 1
}

try {
  $null = git rev-parse --show-toplevel 2>$null
} catch {
  Fail "This folder is not in a git repository."
}

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne "main") {
  Fail "Release thread must publish from ""main"". Current branch: ""$branch""."
}

$dirtyFiles = @(git status --porcelain)
if ($dirtyFiles.Count -gt 0 -and -not $AllowDirty) {
  Fail "Working tree is not clean. Commit or stash in-progress edits before running the release thread. If you intentionally want to validate anyway, run ""npm run release:check -- -AllowDirty""."
}

Write-Host ""
Write-Host "Release check: branch ""$branch"""
if ($dirtyFiles.Count -gt 0 -and $AllowDirty) {
  Write-Host "Dirty working tree allowed for this run."
} else {
  Write-Host "Working tree check passed."
}

$lastCommit = (git log -1 --oneline).Trim()
Write-Host "Last commit: $lastCommit"

Write-Host ""
Write-Host "Building production bundle..."
npm run build
if ($LASTEXITCODE -ne 0) {
  Fail "Production build failed. Fix the errors above before pushing to Vercel production."
}

Write-Host ""
Write-Host "Release check passed." -ForegroundColor Green
Write-Host "Next step: push the approved ""main"" commit to GitHub so Vercel can deploy it to production."
Write-Host ""

# Push greif-agentic-demo to GitHub
Set-Location $PSScriptRoot

if (-not (Test-Path .git)) {
  git init
}

git add -A
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Write-Host "No changes to commit."
} else {
  git commit -m "Initial scaffold: Greif static site clone with CI/CD"
}

git remote remove origin 2>$null
git remote add origin https://github.com/Prasannaverse13/greif-agentic-demo.git
git branch -M main
git push -u origin main

if ($LASTEXITCODE -eq 0) {
  Write-Host "Success! https://github.com/Prasannaverse13/greif-agentic-demo"
} else {
  Write-Host "Push failed. Check git auth: gh auth login"
  exit 1
}

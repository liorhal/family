# Stop any running Next.js dev servers and start fresh
# Run: .\scripts\dev-fresh.ps1

Write-Host "Stopping Node processes (Next.js dev servers)..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Starting dev server..."
Set-Location $PSScriptRoot\..
npm run dev

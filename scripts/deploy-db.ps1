# Deploy database to Supabase using CLI
#
# Step 1: Login (opens browser)
#   npx supabase login
#
# Step 2: Run this script
#   .\scripts\deploy-db.ps1
#
# You'll be prompted for your database password (Supabase Dashboard → Settings → Database)
# Or: $env:PGPASSWORD="your-db-password"; .\scripts\deploy-db.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "Linking project jnigheoieybgeaqurvup..." -ForegroundColor Cyan
npx supabase link --project-ref jnigheoieybgeaqurvup

Write-Host "Pushing migrations..." -ForegroundColor Cyan
npx supabase db push

Write-Host "Database deployed!" -ForegroundColor Green

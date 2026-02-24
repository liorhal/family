# Apply scores_log DELETE policy for reset activity feature
# Opens Supabase SQL Editor and shows the SQL to run

$sql = Get-Content "$PSScriptRoot\apply-reset-policy.sql" -Raw
$url = "https://supabase.com/dashboard/project/jnigheoieybgeaqurvup/sql"

Write-Host "Opening Supabase SQL Editor..." -ForegroundColor Cyan
Start-Process $url

Write-Host "`nCopy and run this SQL:" -ForegroundColor Yellow
Write-Host $sql -ForegroundColor White
$sql | Set-Clipboard
Write-Host "`n(SQL copied to clipboard)" -ForegroundColor Green

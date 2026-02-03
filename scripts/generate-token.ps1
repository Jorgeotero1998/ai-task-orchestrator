$secret = [Guid]::NewGuid().ToString()
$envFile = ".env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile | Where-Object { $_ -notmatch "JWT_SECRET=" }
    $content += "JWT_SECRET=$secret"
    Set-Content -Path $envFile -Value $content
} else {
    Set-Content -Path $envFile -Value "JWT_SECRET=$secret"
}
Write-Host "--- JWT_SECRET Generado y guardado en .env ---" -ForegroundColor Green

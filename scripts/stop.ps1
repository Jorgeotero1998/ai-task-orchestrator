Write-Host "--- Apagando Sistema ---" -ForegroundColor Cyan
docker-compose down --remove-orphans
Write-Host ">> Contenedores detenidos, huérfanos eliminados y red liberada." -ForegroundColor Yellow

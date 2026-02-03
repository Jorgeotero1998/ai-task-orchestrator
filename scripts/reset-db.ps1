Write-Host "=== RESET DE SISTEMA ===" -ForegroundColor Red
docker-compose down -v
Write-Host ">> Volúmenes eliminados. Limpiando caché..." -ForegroundColor Yellow
docker builder prune -f
docker-compose up -d --build
Write-Host "=== SISTEMA NUEVO Y LIMPIO ===" -ForegroundColor Green

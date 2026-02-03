Write-Host "--- ESTADO DEL SISTEMA ---" -ForegroundColor Cyan
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host "
--- REVISANDO LOGS CRITICOS (Backend) ---" -ForegroundColor Yellow
docker logs ai-bio-backend --tail 5

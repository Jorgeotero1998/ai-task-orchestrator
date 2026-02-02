Write-Host '🚀 Iniciando entorno de AI-BIO...' -ForegroundColor Cyan
docker-compose up -d --build
Write-Host '🧪 Ejecutando pruebas de Backend...' -ForegroundColor Yellow
docker-compose exec -T backend pytest
Write-Host '🧪 Ejecutando pruebas de Frontend...' -ForegroundColor Yellow
Write-Host '✅ Sistema verificado y corriendo en http://localhost:3000' -ForegroundColor Green

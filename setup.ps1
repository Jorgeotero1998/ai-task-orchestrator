Write-Host "🚀 Iniciando entorno de AI-BIO Orchestrator..." -ForegroundColor Cyan

# Crear .env si no existe
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creando archivo .env de ejemplo..." -ForegroundColor Yellow
    "GROQ_API_KEY=tu_key_aqui
JWT_SECRET_KEY=bio_secret_777" | Out-File -FilePath ".env" -Encoding utf8
}

Write-Host "📦 Construyendo contenedores optimizados..." -ForegroundColor Green
docker-compose down
docker-compose up -d --build

Write-Host "✅ Entorno listo en http://localhost:3000" -ForegroundColor Green

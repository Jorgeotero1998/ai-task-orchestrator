Write-Host "--- CONFIGURANDO ENTORNO AI-BIO ---" -ForegroundColor Cyan
if (!(Test-Path .env)) {
    New-Item -Path .env -ItemType File
    # Dejamos el espacio para que vos la pegues manualmente en tu PC
    Add-Content .env "GROQ_API_KEY=TU_CLAVE_ACA"
    Add-Content .env "JWT_SECRET=da518918-4787-49a2-ad1d-442520c54234"
    Write-Host ">> Archivo .env creado. Por favor, edita 'GROQ_API_KEY' con tu clave." -ForegroundColor Yellow
} else {
    Write-Host ">> Archivo .env ya existe." -ForegroundColor Green
}

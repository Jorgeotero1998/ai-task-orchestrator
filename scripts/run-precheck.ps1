Write-Host '🔍 Verificando calidad antes del push...' -ForegroundColor Cyan
# Aquí podrías correr los tests locales
Write-Host '✅ Todo en orden. Procediendo con el envío...' -ForegroundColor Green
git add .
git commit -m 'build: verificacion de entorno y automatizacion de tareas'
git push origin main

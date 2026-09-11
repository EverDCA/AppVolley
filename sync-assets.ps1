# Sincroniza los archivos web actuales con el proyecto Android
Write-Host "Sincronizando recursos web con android/app/src/main/assets/..." -ForegroundColor Cyan

$dest = "android\app\src\main\assets"
if (!(Test-Path $dest)) { New-Item -ItemType Directory -Path $dest -Force | Out-Null }

Copy-Item -Path "index.html", "manifest.json", "sw.js" -Destination "$dest\" -Force
Copy-Item -Path "css\*" -Destination "$dest\css\" -Recurse -Force
Copy-Item -Path "js\*" -Destination "$dest\js\" -Recurse -Force

Write-Host "? Recursos web sincronizados correctamente con Android!" -ForegroundColor Green

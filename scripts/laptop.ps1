<#
.SYNOPSIS
  Versión de prueba en una laptop Windows: la app en Docker + Cloudflare Tunnel (HTTPS sin abrir puertos).
  Guía completa: docs/DEPLOY-LAPTOP.md

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\laptop.ps1          # levanta o actualiza app + túnel
  powershell -ExecutionPolicy Bypass -File .\scripts\laptop.ps1 url      # muestra la URL pública
  powershell -ExecutionPolicy Bypass -File .\scripts\laptop.ps1 logs     # logs en vivo (Ctrl+C para salir)
  powershell -ExecutionPolicy Bypass -File .\scripts\laptop.ps1 down     # detiene todo (los datos se conservan)

  Sin TUNNEL_TOKEN en .env usa una URL temporal *.trycloudflare.com y la escribe en APP_URL.
  Con TUNNEL_TOKEN usa tu túnel con dominio fijo (APP_URL debe ser ese dominio).
#>
param([ValidateSet("up", "url", "logs", "down")][string]$Action = "up")

Set-Location (Split-Path $PSScriptRoot -Parent)

$Utf8 = New-Object System.Text.UTF8Encoding($false)
$EnvPath = Join-Path (Get-Location) ".env"
$Compose = @("compose", "-f", "docker-compose.yml", "-f", "docker-compose.tunnel.yml")

function Invoke-Docker([string[]]$Arguments) {
  & docker @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Falló: docker $($Arguments -join ' ')" }
}

function Get-EnvValue([string]$Name) {
  foreach ($line in [IO.File]::ReadAllLines($EnvPath, $Utf8)) {
    if ($line -match "^\s*$Name\s*=\s*(.*)$") { return $Matches[1].Trim().Trim('"').Trim("'") }
  }
  return ""
}

# Reescribe (o añade) una variable conservando el resto del .env tal cual.
function Set-EnvValue([string]$Name, [string]$Value) {
  $lines = [Collections.Generic.List[string]]([IO.File]::ReadAllLines($EnvPath, $Utf8))
  $entry = "$Name=`"$Value`""
  $index = -1
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "^\s*$Name\s*=") { $index = $i; break }
  }
  if ($index -ge 0) { $lines[$index] = $entry } else { $lines.Add($entry) }
  [IO.File]::WriteAllLines($EnvPath, $lines, $Utf8)
}

function New-Secret {
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

function Get-Profile {
  if (Get-EnvValue "TUNNEL_TOKEN") { return "fixed" } else { return "quick" }
}

# La URL temporal solo aparece en los logs de cloudflared; vale la última (cambia si el túnel se recrea).
function Get-QuickTunnelUrl {
  $logs = (& docker @Compose --profile quick logs --no-log-prefix tunnel-quick 2>&1 | ForEach-Object { "$_" }) -join "`n"
  $urls = [regex]::Matches($logs, "https://[a-z0-9-]+\.trycloudflare\.com") |
    ForEach-Object { $_.Value } | Where-Object { $_ -ne "https://api.trycloudflare.com" }
  if ($urls) { return @($urls)[-1] }
  return $null
}

function Wait-QuickTunnelUrl {
  for ($i = 0; $i -lt 30; $i++) {
    $url = Get-QuickTunnelUrl
    if ($url) { return $url }
    Start-Sleep -Seconds 2
  }
  throw "El túnel no dio una URL en 60 s. Revisa: docker compose -f docker-compose.yml -f docker-compose.tunnel.yml --profile quick logs tunnel-quick"
}

function Wait-App {
  for ($i = 0; $i -lt 45; $i++) {
    try {
      Invoke-WebRequest "http://localhost:3000/login" -UseBasicParsing -TimeoutSec 3 | Out-Null
      return $true
    } catch { Start-Sleep -Seconds 2 }
  }
  return $false
}

function Assert-Ready {
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw "No encuentro Docker. Instala Docker Desktop." }
  & docker info *> $null
  if ($LASTEXITCODE -ne 0) { throw "Docker no está corriendo. Abre Docker Desktop y espera a que diga 'Engine running'." }

  if (-not (Test-Path $EnvPath)) {
    Copy-Item ".env.example" $EnvPath
    Write-Host "Creado .env desde .env.example." -ForegroundColor Yellow
  }
  if ((Get-EnvValue "SESSION_SECRET").Length -lt 32) {
    Set-EnvValue "SESSION_SECRET" (New-Secret)
    Write-Host "Generado SESSION_SECRET en .env." -ForegroundColor Yellow
  }
  # Expuesta a internet nunca va sin login.
  $missing = @("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "ADMIN_EMAILS") | Where-Object { -not (Get-EnvValue $_) }
  if ($missing) { throw "Completa en .env: $($missing -join ', ') (ver docs/DEPLOY-LAPTOP.md)." }
}

function Start-All {
  Assert-Ready
  $tunnelProfile = Get-Profile
  $changed = $false

  if ($tunnelProfile -eq "fixed") {
    $url = Get-EnvValue "APP_URL"
    if ($url -notmatch "^https://" -or $url -match "localhost|trycloudflare") {
      throw "Con TUNNEL_TOKEN, APP_URL debe ser tu dominio con https:// (ej. https://beta.tudominio.com)."
    }
    Write-Host "Levantando app + túnel con dominio fijo..." -ForegroundColor Cyan
    Invoke-Docker ($Compose + @("--profile", "quick", "rm", "-sf", "tunnel-quick"))
    Invoke-Docker ($Compose + @("--profile", "fixed", "up", "-d", "--build"))
  } else {
    Write-Host "Levantando túnel temporal (trycloudflare)..." -ForegroundColor Cyan
    Invoke-Docker ($Compose + @("--profile", "fixed", "rm", "-sf", "tunnel"))
    Invoke-Docker ($Compose + @("--profile", "quick", "up", "-d", "tunnel-quick"))
    $url = Wait-QuickTunnelUrl
    if ((Get-EnvValue "APP_URL") -ne $url) {
      Set-EnvValue "APP_URL" $url
      $changed = $true
    }
    Write-Host "Construyendo y levantando la app..." -ForegroundColor Cyan
    $up = @("--profile", "quick", "up", "-d", "--build")
    if ($changed) { $up += "--force-recreate" }
    Invoke-Docker ($Compose + $up + @("app"))
  }

  Write-Host "Esperando a que la app responda..." -ForegroundColor Cyan
  if (-not (Wait-App)) { Write-Host "La app no responde todavía. Mira los logs: .\scripts\laptop.ps1 logs" -ForegroundColor Red }

  Write-Host ""
  Write-Host "Listo: $url" -ForegroundColor Green
  Write-Host "URI de redirección en Google: $url/api/auth/google/callback"
  if ($changed) {
    Write-Host ""
    Write-Host "La URL CAMBIÓ:" -ForegroundColor Yellow
    Write-Host " 1. Añade la URI de arriba en Google Cloud Console (Credenciales > tu cliente OAuth)."
    Write-Host " 2. Avisa a los testers: la URL del widget en OBS cambió (cópienla de nuevo desde el panel)."
  }
}

try {
  switch ($Action) {
    "up" { Start-All }
    "url" {
      if ((Get-Profile) -eq "fixed") { Get-EnvValue "APP_URL" } else { Get-QuickTunnelUrl }
    }
    "logs" { & docker @Compose --profile (Get-Profile) logs -f --tail 100 }
    "down" { Invoke-Docker ($Compose + @("--profile", "quick", "--profile", "fixed", "down")) }
  }
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}

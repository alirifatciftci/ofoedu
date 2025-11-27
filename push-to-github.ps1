# GitHub Push Script
# Bu dosyayı sağ tıklayıp "Run with PowerShell" ile çalıştırın

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GitHub'a Push İşlemi Başlatılıyor..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\Users\aliri\ofoedu"
Set-Location $projectPath

try {
    # 1. Git repo kontrolü
    Write-Host "[1/7] Git repository kontrol ediliyor..." -ForegroundColor Yellow
    if (-not (Test-Path ".git")) {
        Write-Host "      Git repo yok, başlatılıyor..." -ForegroundColor Gray
        git init
    }
    else {
        Write-Host "      Git repo mevcut" -ForegroundColor Green
    }

    # 2. Kullanıcı bilgileri
    Write-Host "[2/7] Git kullanıcı bilgileri ayarlanıyor..." -ForegroundColor Yellow
    git config user.name "alirifatciftci"
    git config user.email "alirifatciftci@users.noreply.github.com"
    Write-Host "      Kullanıcı bilgileri ayarlandı" -ForegroundColor Green

    # 3. Remote ayarlama
    Write-Host "[3/7] Remote repository ayarlanıyor..." -ForegroundColor Yellow
    $remoteExists = git remote get-url origin 2>$null
    if ($LASTEXITCODE -eq 0) {
        git remote remove origin
    }
    git remote add origin https://github.com/alirifatciftci/ofoedu.git
    Write-Host "      Remote eklendi: https://github.com/alirifatciftci/ofoedu.git" -ForegroundColor Green

    # 4. Dosyaları ekle
    Write-Host "[4/7] Dosyalar ekleniyor..." -ForegroundColor Yellow
    git add .
    $stagedFiles = git diff --cached --name-only
    Write-Host "      $($stagedFiles.Count) dosya eklendi" -ForegroundColor Green

    # 5. Commit
    Write-Host "[5/7] Commit yapılıyor..." -ForegroundColor Yellow
    git commit -m "Initial commit: Expo football trivia app"
    Write-Host "      Commit başarılı" -ForegroundColor Green

    # 6. Branch ayarla
    Write-Host "[6/7] Branch main olarak ayarlanıyor..." -ForegroundColor Yellow
    git branch -M main
    Write-Host "      Branch ayarlandı" -ForegroundColor Green

    # 7. Push
    Write-Host "[7/7] GitHub'a push ediliyor..." -ForegroundColor Yellow
    Write-Host "      (Bu işlem authentication gerektirebilir)" -ForegroundColor Gray
    git push -u origin main --force
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ Push işlemi tamamlandı!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository: https://github.com/alirifatciftci/ofoedu" -ForegroundColor Cyan
    
}
catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "✗ Hata oluştu!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Eğer authentication hatası alıyorsanız:" -ForegroundColor Yellow
    Write-Host "1. GitHub'da Personal Access Token oluşturun" -ForegroundColor Yellow
    Write-Host "2. Token ile push yapın" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Devam etmek için bir tuşa basın..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")



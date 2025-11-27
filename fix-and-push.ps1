# Fix and Push Script
cd C:\Users\aliri\ofoedu

Write-Host "1. Remote URL düzeltiliyor..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/alirifatciftci/ofoedu.git
git remote -v

Write-Host "`n2. Dosyalar ekleniyor..." -ForegroundColor Yellow
git add .

Write-Host "`n3. Commit yapılıyor..." -ForegroundColor Yellow
git commit -m "Initial commit: Expo football trivia app"

Write-Host "`n4. Branch main olarak ayarlanıyor..." -ForegroundColor Yellow
git branch -M main

Write-Host "`n5. GitHub'a push ediliyor..." -ForegroundColor Yellow
Write-Host "   (Authentication gerekebilir - username: alirifatciftci, password: GitHub token)" -ForegroundColor Gray
git push -u origin main

Write-Host "`n✓ Tamamlandı!" -ForegroundColor Green


@echo off
cd /d C:\Users\aliri\ofoedu

echo ========================================
echo GitHub'a Push Islemi Baslatiyor...
echo ========================================
echo.

echo [1/5] Remote URL duzeltiliyor...
git remote remove origin 2>nul
git remote add origin https://github.com/alirifatciftci/ofoedu.git
git remote -v
echo.

echo [2/5] Dosyalar ekleniyor...
git add .
echo.

echo [3/5] Commit yapiliyor...
git commit -m "Initial commit: Expo football trivia app"
echo.

echo [4/5] Branch main olarak ayarlaniyor...
git branch -M main
echo.

echo [5/5] GitHub'a push ediliyor...
echo (Authentication gerekebilir - username: alirifatciftci, password: GitHub token)
git push -u origin main
echo.

echo ========================================
echo Tamamlandi!
echo ========================================
echo.
pause



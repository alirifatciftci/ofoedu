# GitHub'a Push İçin Komutlar

Terminalde (PowerShell veya CMD) şu komutları sırayla çalıştırın:

```powershell
cd C:\Users\aliri\ofoedu

# 1. Git repository'yi başlat (eğer yoksa)
git init

# 2. Kullanıcı bilgilerini ayarla
git config user.name "alirifatciftci"
git config user.email "alirifatciftci@users.noreply.github.com"

# 3. Remote repository'yi ekle
git remote remove origin 2>$null
git remote add origin https://github.com/alirifatciftci/ofoedu.git

# 4. Tüm dosyaları ekle (.gitignore'a göre gereksizler ignore edilecek)
git add .

# 5. Commit yap
git commit -m "Initial commit: Expo football trivia app"

# 6. Branch'i main olarak ayarla
git branch -M main

# 7. GitHub'a push et
git push -u origin main
```

**Not:** Eğer authentication hatası alırsanız:

1. GitHub'da Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Yeni token oluşturun (repo yetkisi verin)
3. Push yaparken username olarak GitHub kullanıcı adınızı, password olarak token'ı kullanın



# Supabase Database Setup

Bu klasörde Supabase veritabanını kurmak için gerekli SQL dosyaları bulunmaktadır.

## Kurulum Adımları

### 1. Supabase Dashboard'a Giriş
1. [Supabase Dashboard](https://app.supabase.com) adresine gidin
2. Projenizi seçin: `awpcbdluifoqarmwihjs`

### 2. SQL Editor'ü Açın
1. Sol menüden **SQL Editor** seçeneğine tıklayın
2. **New query** butonuna tıklayın

### 3. SQL Dosyasını Çalıştırın
1. `setup_database.sql` dosyasının içeriğini kopyalayın
2. SQL Editor'e yapıştırın
3. **Run** butonuna tıklayın (veya `Ctrl+Enter`)

### 4. Kontrol Edin
SQL çalıştıktan sonra:
- **Table Editor**'dan tabloları kontrol edebilirsiniz
- `clubs`, `players`, `player_career_history`, `guess_player_games`, `common_link_games`, `user_game_stats` tabloları oluşmuş olmalı
- Örnek veriler eklenmiş olmalı

## Dosyalar

- **`setup_database.sql`** - Tüm tabloları oluşturur ve örnek veriler ekler
- **`20251127131825_create_football_trivia_schema.sql`** - Orijinal migration dosyası (referans için)

## Örnek Veriler

SQL dosyası şunları içerir:
- **14 Kulüp**: Galatasaray, Fenerbahçe, Real Madrid, Barcelona, Arsenal, Chelsea, vb.
- **15 Oyuncu**: Arda Güler, Hakan Çalhanoğlu, Cristiano Ronaldo, Lionel Messi, vb.
- **Kariyer Geçmişleri**: Her oyuncunun kulüp geçmişi
- **5 Guess Player Game**: Aktif oyunlar
- **5 Common Link Game**: Aktif oyunlar

## Sorun Giderme

### Hata: "relation already exists"
- Tablolar zaten oluşturulmuş olabilir
- `DROP TABLE` komutlarını kullanarak önce temizleyebilirsiniz (dikkatli olun!)

### Hata: "permission denied"
- RLS (Row Level Security) politikaları doğru ayarlanmış olmalı
- SQL dosyasındaki policy'leri kontrol edin

### Veri görünmüyor
- **Table Editor**'da tabloları kontrol edin
- RLS politikalarının doğru olduğundan emin olun

## Notlar

- `user_game_stats` tablosunda `user_id` ve `game_id` alanları `text` tipindedir (anon kullanıcılar için)
- Tüm tablolarda RLS (Row Level Security) etkindir
- `get_common_players` RPC function'ı otomatik oluşturulur


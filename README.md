# OFO Edu - Football Trivia App

Expo ile geliştirilmiş futbol trivia ve bulmaca uygulaması.

## Özellikler

- **Guess The Player**: Oyuncu kariyer geçmişine bakarak oyuncuyu tahmin etme oyunu
- **Common Link**: İki kulüp arasındaki ortak oyuncuları bulma oyunu
- **Stats**: Oyun istatistiklerini görüntüleme

## Teknolojiler

- **Expo** - React Native framework
- **Expo Router** - File-based routing
- **TypeScript** - Type safety
- **Supabase** - Backend ve veritabanı (opsiyonel)

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

## Ortam Değişkenleri

Supabase kullanmak için `.env` dosyası oluşturun:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Proje Yapısı

```
├── app/              # Expo Router sayfaları
├── components/       # React bileşenleri
├── lib/             # Yardımcı kütüphaneler
├── hooks/           # Custom React hooks
├── types/           # TypeScript type tanımları
├── assets/          # Görseller ve diğer assetler
└── supabase/        # Supabase migration dosyaları
```

## Lisans

MIT


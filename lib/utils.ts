// Türkçe karakterleri normalize eden fonksiyon
export function normalizeTurkish(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i')
    .replace(/Ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/Ö/g, 'o')
    .replace(/Ç/g, 'c');
}

// İki string'i Türkçe karakter toleransı ile karşılaştır
export function compareTurkish(str1: string, str2: string): boolean {
  return normalizeTurkish(str1) === normalizeTurkish(str2);
}

// String'in başka bir string ile başlayıp başlamadığını kontrol et (Türkçe karakter toleransı ile)
export function startsWithTurkish(str: string, prefix: string): boolean {
  return normalizeTurkish(str).startsWith(normalizeTurkish(prefix));
}


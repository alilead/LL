import { AES, enc } from 'crypto-js';

/**
 * Güvenlik yardımcı fonksiyonları
 */
export const security = {
  /**
   * Veriyi şifrele
   * @param data - Şifrelenecek veri
   * @param secretKey - Şifreleme anahtarı
   */
  encrypt: (data: string, secretKey: string): string => {
    return AES.encrypt(data, secretKey).toString();
  },

  /**
   * Şifrelenmiş veriyi çöz
   * @param encryptedData - Şifrelenmiş veri
   * @param secretKey - Şifreleme anahtarı
   */
  decrypt: (encryptedData: string, secretKey: string): string => {
    const bytes = AES.decrypt(encryptedData, secretKey);
    return bytes.toString(enc.Utf8);
  },

  /**
   * XSS koruması için HTML escape
   * @param str - İşlenecek string
   */
  escapeHtml: (str: string): string => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * CSRF token oluştur
   */
  generateCsrfToken: (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  },

  /**
   * Input sanitization
   * @param input - Temizlenecek input
   */
  sanitizeInput: (input: string): string => {
    return input
      .replace(/[&<>"']/g, (char) => {
        const entities: { [key: string]: string } = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        };
        return entities[char];
      })
      .trim();
  },

  /**
   * Rate limiting için
   */
  rateLimiter: () => {
    const requests: { [key: string]: number[] } = {};
    const limit = 100; // İstek limiti
    const interval = 60000; // Zaman aralığı (ms)

    return {
      /**
       * İstek limitini kontrol et
       * @param key - İstek anahtarı (örn: IP adresi)
       */
      checkLimit: (key: string): boolean => {
        const now = Date.now();
        if (!requests[key]) {
          requests[key] = [now];
          return true;
        }

        // Eski istekleri temizle
        requests[key] = requests[key].filter((time) => time > now - interval);

        if (requests[key].length >= limit) {
          return false;
        }

        requests[key].push(now);
        return true;
      },

      /**
       * İstek sayısını sıfırla
       * @param key - İstek anahtarı
       */
      resetLimit: (key: string): void => {
        delete requests[key];
      },
    };
  },

  /**
   * Güvenli headers oluştur
   */
  secureHeaders: {
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  },

  /**
   * Dosya güvenliği kontrolü
   * @param file - Kontrol edilecek dosya
   */
  validateFile: (file: File): boolean => {
    // İzin verilen dosya tipleri
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    // Maksimum dosya boyutu (5MB)
    const maxSize = 5 * 1024 * 1024;

    return allowedTypes.includes(file.type) && file.size <= maxSize;
  },

  /**
   * URL güvenliği kontrolü
   * @param url - Kontrol edilecek URL
   */
  validateUrl: (url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      // İzin verilen domainler
      const allowedDomains = ['example.com', 'api.example.com'];
      return allowedDomains.includes(parsedUrl.hostname);
    } catch {
      return false;
    }
  },
};

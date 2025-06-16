import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Scroll pozisyonlarını saklayacak nesne (key: path, value: scroll pozisyonu)
const scrollPositions: Record<string, number> = {};

// Geçerli route için önceki scroll pozisyonun ne zaman uygulanacağını kontrol eden değişken
let scrollRestorationTimeoutId: number | null = null;

/**
 * ScrollManager component
 * 
 * Bu bileşen, kullanıcının sayfalara gittiğinde ve geri döndüğünde scroll pozisyonunu korur.
 * - Sayfa değiştiğinde mevcut scroll pozisyonunu kaydeder
 * - Sayfaya geri dönüldüğünde, eğer daha önce kaydedilmiş pozisyon varsa, bu pozisyona scroll eder
 * - İlk kez ziyaret edilen bir sayfa için, window en üste scroll edilir
 */
export function ScrollManager() {
  const { pathname } = useLocation();
  const prevPathRef = useRef<string | null>(null);
  const scrollToPositionAttempts = useRef(0);

  // Kaydedilmiş scroll pozisyonuna kaydırma işlemi - birkaç kez denemeyi içerir
  const scrollToSavedPosition = (path: string, position: number) => {
    if (scrollRestorationTimeoutId) {
      window.clearTimeout(scrollRestorationTimeoutId);
    }

    // Kaydırma işlemi içeren fonksiyon
    const attemptScroll = () => {
      try {
        window.scrollTo(0, position);
        
        // Gerçek scroll pozisyonunu kontrol et
        const actualScrollPosition = window.scrollY;
        
        // Eğer hedef pozisyona ulaşılmadıysa ve maksimum deneme sayısını aşmadıysak yeniden dene
        if (Math.abs(actualScrollPosition - position) > 50 && scrollToPositionAttempts.current < 5) {
          scrollToPositionAttempts.current++;
          scrollRestorationTimeoutId = window.setTimeout(attemptScroll, 100);
        } else {
          scrollToPositionAttempts.current = 0;
        }
      } catch (error) {
        console.error('Error when scrolling:', error);
      }
    };

    // İlk deneme - sayfa tamamen yüklendiğinde ve DOM güncellendiğinde daha güvenilir olması için
    // küçük bir gecikme ekleyelim
    scrollRestorationTimeoutId = window.setTimeout(attemptScroll, 100);
  };

  useEffect(() => {
    // Sayfa değiştiğinde çalışır
    const handleRouteChange = () => {
      // Önceki sayfanın scroll pozisyonunu kaydet
      if (prevPathRef.current) {
        scrollPositions[prevPathRef.current] = window.scrollY;
      }

      // Eğer bu sayfaya daha önce gidilmişse ve kaydedilmiş bir scroll pozisyonu varsa,
      // o pozisyona git
      if (scrollPositions[pathname] !== undefined) {
        scrollToPositionAttempts.current = 0;
        scrollToSavedPosition(pathname, scrollPositions[pathname]);
      } else {
        // İlk kez ziyaret edilen sayfa - en üste git
        window.scrollTo(0, 0);
      }

      // Şimdiki sayfayı bir sonraki değişiklik için kaydet
      prevPathRef.current = pathname;
    };

    handleRouteChange();

    // Component unmount olduğunda temizlik
    return () => {
      if (prevPathRef.current) {
        scrollPositions[prevPathRef.current] = window.scrollY;
      }
      
      // Tüm zamanlayıcıları temizle
      if (scrollRestorationTimeoutId) {
        window.clearTimeout(scrollRestorationTimeoutId);
      }
    };
  }, [pathname]);

  // Tarayıcı geçmişi yönetimini dinleme (geri/ileri düğmeleri)
  useEffect(() => {
    const handlePopState = () => {
      // Biraz gecikme ekleyerek pop state sonrası scroll pozisyonunun doğru kaydırılmasını sağlayalım
      setTimeout(() => {
        if (pathname && scrollPositions[pathname] !== undefined) {
          scrollToSavedPosition(pathname, scrollPositions[pathname]);
        }
      }, 100);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname]);

  return null;
}

export default ScrollManager; 
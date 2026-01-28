import { useEffect, useRef, useCallback } from 'react';

/**
 * Klavye navigasyonu için hook
 */
export function useKeyboardNav() {
  useEffect(() => {
    const handleFirstTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('user-is-tabbing');
        window.removeEventListener('keydown', handleFirstTab);
      }
    };

    window.addEventListener('keydown', handleFirstTab);
    return () => {
      window.removeEventListener('keydown', handleFirstTab);
    };
  }, []);
}

/**
 * Focus yönetimi için hook
 */
export function useFocusTrap() {
  const elementRef = useRef<HTMLElement>(null);

  const handleFocus = useCallback((e: KeyboardEvent) => {
    if (!elementRef.current) return;

    const focusableElements = elementRef.current.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );

    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (element) {
      element.addEventListener('keydown', handleFocus);
    }
    return () => {
      if (element) {
        element.removeEventListener('keydown', handleFocus);
      }
    };
  }, [handleFocus]);

  return elementRef;
}

/**
 * ARIA live bölgesi için hook
 */
export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((message: string) => {
    setAnnouncement('');
    // Force a re-render for screen readers
    setTimeout(() => setAnnouncement(message), 100);
  }, []);

  return {
    announcement,
    announce,
    AnnouncementRegion: () => (
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    ),
  };
}

/**
 * Skip link için hook
 */
export function useSkipLink() {
  const skipLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const handleSkipLink = () => {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView();
      }
    };

    const skipLink = skipLinkRef.current;
    if (skipLink) {
      skipLink.addEventListener('click', handleSkipLink);
    }

    return () => {
      if (skipLink) {
        skipLink.removeEventListener('click', handleSkipLink);
      }
    };
  }, []);

  return {
    skipLinkRef,
    SkipLink: () => (
      <a
        ref={skipLinkRef}
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white focus:text-black"
      >
        Ana içeriğe atla
      </a>
    ),
  };
}

/**
 * Kontrast kontrolü için hook
 */
export function useContrastCheck() {
  const checkContrast = useCallback((foreground: string, background: string) => {
    // Renk değerlerini RGB'ye dönüştür
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
    };

    // Relative luminance hesapla
    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const fg = hexToRgb(foreground);
    const bg = hexToRgb(background);

    if (!fg || !bg) return null;

    const l1 = getLuminance(fg.r, fg.g, fg.b);
    const l2 = getLuminance(bg.r, bg.g, bg.b);

    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio,
      isAA: ratio >= 4.5,
      isAAA: ratio >= 7,
    };
  }, []);

  return checkContrast;
}

/**
 * Erişilebilirlik kontrolleri için hook
 */
export function useA11yCheck() {
  const checkA11y = useCallback((element: HTMLElement) => {
    const issues: string[] = [];

    // Alt text kontrolü
    const images = element.getElementsByTagName('img');
    Array.from(images).forEach((img) => {
      if (!img.alt) {
        issues.push(`Image missing alt text: ${img.src}`);
      }
    });

    // ARIA label kontrolü
    const buttons = element.getElementsByTagName('button');
    Array.from(buttons).forEach((button) => {
      if (!button.textContent && !button.getAttribute('aria-label')) {
        issues.push('Button missing aria-label');
      }
    });

    // Heading sırası kontrolü
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    Array.from(headings).forEach((heading) => {
      const currentLevel = parseInt(heading.tagName[1]);
      if (currentLevel - previousLevel > 1) {
        issues.push(`Heading level skipped from h${previousLevel} to h${currentLevel}`);
      }
      previousLevel = currentLevel;
    });

    return issues;
  }, []);

  return checkA11y;
}

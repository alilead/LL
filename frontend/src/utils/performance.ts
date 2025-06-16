import { ComponentType, memo } from 'react';
import { isEqual } from 'lodash';

/**
 * Bileşenleri memoize etmek için yardımcı fonksiyon
 * @param component - Memoize edilecek bileşen
 * @param propsAreEqual - Props karşılaştırma fonksiyonu (opsiyonel)
 */
export function memoWithEqual<P extends object>(
  component: ComponentType<P>,
  propsAreEqual = isEqual
) {
  return memo(component, propsAreEqual);
}

/**
 * Performans metrikleri için yardımcı fonksiyonlar
 */
export const performanceMetrics = {
  /**
   * Bileşen render süresini ölçer
   * @param componentName - Bileşen adı
   * @param callback - Ölçülecek fonksiyon
   */
  measureRenderTime: (componentName: string, callback: () => void) => {
    const start = performance.now();
    callback();
    const end = performance.now();
    console.debug(`[Performance] ${componentName} render time: ${end - start}ms`);
  },

  /**
   * Sayfa yükleme metriklerini toplar
   */
  collectPageMetrics: () => {
    if (window.performance && window.performance.getEntriesByType) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const metrics = {
        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnection: navigation.connectEnd - navigation.connectStart,
        serverResponse: navigation.responseEnd - navigation.requestStart,
        domLoad: navigation.domComplete - navigation.domLoading,
        fullPageLoad: navigation.loadEventEnd - navigation.navigationStart,
      };
      console.debug('[Performance] Page Load Metrics:', metrics);
      return metrics;
    }
    return null;
  },
};

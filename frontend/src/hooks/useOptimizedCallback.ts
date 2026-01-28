import { useCallback, useMemo, DependencyList } from 'react';

/**
 * Performans optimizasyonu için callback fonksiyonlarını optimize eden hook
 * @param callback - Optimize edilecek callback fonksiyonu
 * @param deps - Bağımlılık listesi
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Performans optimizasyonu için değerleri memoize eden hook
 * @param factory - Hesaplanacak değer
 * @param deps - Bağımlılık listesi
 */
export function useOptimizedValue<T>(factory: () => T, deps: DependencyList): T {
  return useMemo(factory, deps);
}

/**
 * Performans optimizasyonu için liste işlemlerini optimize eden hook
 * @param items - İşlenecek liste
 * @param keyExtractor - Liste elemanlarından key üreten fonksiyon
 * @param deps - Ek bağımlılıklar
 */
export function useOptimizedList<T>(
  items: T[],
  keyExtractor: (item: T) => string | number,
  deps: DependencyList = []
): {
  optimizedItems: T[];
  getKey: (item: T) => string | number;
} {
  const getKey = useCallback(keyExtractor, []);

  const optimizedItems = useMemo(() => {
    return items;
  }, [items, ...deps]);

  return {
    optimizedItems,
    getKey,
  };
}

/**
 * Performans optimizasyonu için event handler'ları optimize eden hook
 * @param handler - Event handler fonksiyonu
 * @param deps - Bağımlılık listesi
 */
export function useOptimizedEventHandler<T extends (...args: any[]) => any>(
  handler: T,
  deps: DependencyList = []
): T {
  return useCallback((event: any, ...args: any[]) => {
    if (event?.persist) {
      event.persist();
    }
    return handler(event, ...args);
  }, deps) as T;
}

/**
 * Performans optimizasyonu için debounce edilmiş değerleri hesaplayan hook
 * @param value - Hesaplanacak değer
 * @param delay - Debounce gecikmesi (ms)
 */
export function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track API response times
  trackApiCall(endpoint: string, duration: number) {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    this.metrics.get(endpoint)!.push(duration);
    
    // Keep only last 50 measurements
    if (this.metrics.get(endpoint)!.length > 50) {
      this.metrics.get(endpoint)!.shift();
    }
  }

  // Track voice recognition performance
  trackVoiceRecognition(action: 'start' | 'result' | 'error', duration?: number) {
    const key = `voice_${action}`;
    if (duration !== undefined) {
      this.trackApiCall(key, duration);
    }
    
    if (action === 'error') {
      console.warn('Voice recognition error detected');
    }
  }

  // Get performance summary
  getMetrics(endpoint?: string): Record<string, any> {
    if (endpoint) {
      const times = this.metrics.get(endpoint) || [];
      return {
        endpoint,
        count: times.length,
        average: times.reduce((a, b) => a + b, 0) / times.length || 0,
        min: Math.min(...times) || 0,
        max: Math.max(...times) || 0
      };
    }

    const summary: Record<string, any> = {};
    this.metrics.forEach((times, endpoint) => {
      summary[endpoint] = {
        count: times.length,
        average: times.reduce((a, b) => a + b, 0) / times.length || 0,
        min: Math.min(...times) || 0,
        max: Math.max(...times) || 0
      };
    });
    return summary;
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear();
  }
}

// Enhanced API request wrapper with performance tracking
export async function trackedApiRequest(
  url: string, 
  options?: RequestInit
): Promise<Response> {
  const monitor = PerformanceMonitor.getInstance();
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    const duration = performance.now() - startTime;
    monitor.trackApiCall(url, duration);
    
    // Log slow requests in development
    if (duration > 1000 && process.env.NODE_ENV === 'development') {
      console.warn(`Slow API request to ${url}: ${duration.toFixed(2)}ms`);
    }
    
    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    monitor.trackApiCall(`${url}_error`, duration);
    throw error;
  }
}

// Memory usage tracker
export function trackMemoryUsage(): void {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('Memory Usage:', {
      used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
    });
  }
}

// Bundle size analyzer for development
export function analyzeBundleSize(): void {
  if (process.env.NODE_ENV === 'development') {
    const scripts = Array.from(document.scripts);
    const totalSize = scripts.reduce((total, script) => {
      if (script.src && script.src.includes('localhost')) {
        return total + (script.getAttribute('data-size') ? 
          parseInt(script.getAttribute('data-size')!) : 0);
      }
      return total;
    }, 0);
    
    console.log(`Estimated bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
  }
}
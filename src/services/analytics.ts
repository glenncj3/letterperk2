/**
 * Google Analytics 4 (GA4) integration service.
 * Provides functions for tracking pageviews and custom events.
 */

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Google Analytics service for tracking pageviews and events.
 */
class AnalyticsService {
  private measurementId: string | null = null;
  private isInitialized = false;

  /**
   * Initializes Google Analytics with the provided Measurement ID.
   * @param measurementId - GA4 Measurement ID (e.g., G-XXXXXXXXXX)
   */
  initialize(measurementId: string | undefined): void {
    if (!measurementId) {
      // GA not configured - this is fine for local development
      return;
    }

    this.measurementId = measurementId;
    this.isInitialized = true;

    // Initialize dataLayer if not already present
    if (!window.dataLayer) {
      window.dataLayer = [];
    }

    // Define gtag function if not already present
    if (!window.gtag) {
      window.gtag = function() {
        window.dataLayer!.push(arguments);
      };
    }

    // Set initial timestamp
    window.gtag('js', new Date());

    // Configure GA4
    window.gtag('config', measurementId, {
      send_page_view: false, // We'll send pageviews manually
    });
  }

  /**
   * Tracks a pageview.
   * @param pagePath - The path of the page (e.g., '/', '/game')
   * @param pageTitle - Optional page title
   */
  trackPageView(pagePath: string, pageTitle?: string): void {
    if (!this.isInitialized || !this.measurementId) {
      return;
    }

    window.gtag?.('config', this.measurementId, {
      page_path: pagePath,
      page_title: pageTitle || document.title,
    });
  }

  /**
   * Tracks a custom event.
   * @param eventName - Name of the event
   * @param eventParams - Optional event parameters
   */
  trackEvent(eventName: string, eventParams?: Record<string, unknown>): void {
    if (!this.isInitialized || !this.measurementId) {
      return;
    }

    window.gtag?.('event', eventName, eventParams);
  }

  /**
   * Checks if analytics is initialized and ready to use.
   */
  isReady(): boolean {
    return this.isInitialized && this.measurementId !== null;
  }
}

// Singleton instance
const analyticsService = new AnalyticsService();

/**
 * Initializes Google Analytics.
 * Should be called once when the app loads.
 */
export function initializeAnalytics(): void {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  analyticsService.initialize(measurementId);
}

/**
 * Tracks a pageview.
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  analyticsService.trackPageView(pagePath, pageTitle);
}

/**
 * Tracks a custom event.
 */
export function trackEvent(eventName: string, eventParams?: Record<string, unknown>): void {
  analyticsService.trackEvent(eventName, eventParams);
}

/**
 * Checks if analytics is ready.
 */
export function isAnalyticsReady(): boolean {
  return analyticsService.isReady();
}


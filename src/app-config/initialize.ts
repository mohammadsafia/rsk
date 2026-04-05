/**
 * Application initialization orchestration
 * This module provides structured initialization of all application services
 */

import AppConfigurations from './AppConfigurations';

/**
 * Types of initialization modules
 */
export const enum InitializationType {
  ERROR_MONITORING = 'ERROR_MONITORING',
  ANALYTICS = 'ANALYTICS',
  AUTH = 'AUTH',
  API = 'API',
  MESSAGING = 'MESSAGING',
  CHUNK_RELOAD = 'CHUNK_RELOAD',
}

/**
 * Initializes Sentry error monitoring
 */
const initializeSentry = async (): Promise<void> => {
  try {
    const env = AppConfigurations.VITE_APP_ENVIRONMENT || 'development';

    if (env !== 'production') {
      console.info(`📊 Initializing Sentry in ${env} environment`);
    }

    await import('./SentryConfig');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
};

/**
 * Initialize Firebase messaging (placeholder)
 */
const initializeMessaging = async (): Promise<void> => {
  try {
    await import('./FirebaseConfig');
  } catch (error) {
    console.error('Failed to initialize Messaging:', error);
  }
};

/**
 * Initialize authentication
 * Note: Authentication is now handled by AuthProvider (react-oidc-context) in App.tsx
 * This function is kept for backward compatibility but does nothing
 */
const initializeAuth = (): void => {
  // OIDC authentication is initialized via <AuthProvider> in App.tsx
};

/**
 * Initialize chunk reload handler
 * Listens for Vite preload errors and automatically reloads the page once
 * to recover from stale chunks after a new deployment
 */
const initializeChunkReload = (): void => {
  window.addEventListener('vite:preloadError', () => {
    const lastReload = sessionStorage.getItem('chunk-reload');
    const now = Date.now();

    if (!lastReload || now - Number(lastReload) > 10_000) {
      sessionStorage.setItem('chunk-reload', String(now));
      window.location.reload();
    }
  });
};

/**
 * Map of initializers by type
 */
const initializers: Record<InitializationType, (() => void | Promise<void>) | undefined> = {
  [InitializationType.ERROR_MONITORING]: initializeSentry,
  [InitializationType.MESSAGING]: initializeMessaging,
  [InitializationType.AUTH]: initializeAuth,
  [InitializationType.CHUNK_RELOAD]: initializeChunkReload,
  [InitializationType.ANALYTICS]: undefined,
  [InitializationType.API]: undefined,
};

/**
 * Order of initialization - defines the sequence
 */
const initializationOrder = [
  InitializationType.ERROR_MONITORING, // Initialize error monitoring first
  InitializationType.AUTH,
  InitializationType.MESSAGING,
  InitializationType.CHUNK_RELOAD,
];

/**
 * Main initialization function that orchestrates the initialization process
 * @param types Optional array of specific initialization types to run
 */
export const initialize = async (types?: InitializationType[]): Promise<void> => {
  const typesToInitialize = types || initializationOrder;

  console.info('🚀 Application initialization started');

  // Run initializers in specified order
  for (const type of typesToInitialize) {
    const initializer = initializers[type];
    if (initializer) {
      try {
        await initializer();
      } catch (error) {
        // If an initializer fails, log it but continue with others
        console.error(`Failed to run ${type} initializer:`, error);
      }
    }
  }

  console.info('✅ Application initialization completed');
};

/**
 * Export a default function for simple usage
 */
export default initialize;

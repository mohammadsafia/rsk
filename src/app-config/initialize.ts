/**
 * Application initialization orchestration
 * This module provides structured initialization of all application services
 */


/**
 * Types of initialization modules
 */
export const enum InitializationType {
  CHUNK_RELOAD = 'CHUNK_RELOAD',
}

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
  [InitializationType.CHUNK_RELOAD]: initializeChunkReload,
};

/**
 * Order of initialization - defines the sequence
 */
const initializationOrder = [
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

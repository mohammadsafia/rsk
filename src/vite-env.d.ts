/// <reference types="vite/client" />

// Vite client types are loaded via tsconfig.json "types" field

import { AppConfig } from 'types';

// Extend Window interface for runtime config
interface Window {
  appConfig?: AppConfig;
}

// Vite environment variables
interface ImportMetaEnv {
  // Mode
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;

  // Base URL for API
  readonly VITE_APP_BASE_URL: string;
  readonly VITE_BASE_URL: string;

  // Authentication
  readonly VITE_APP_AUTHORITY: string;
  readonly VITE_APP_CLIENT_ID: string;
  readonly VITE_APP_REDIRECT_URI: string;
  readonly VITE_CLIENT_ID: string;
  readonly VITE_AUTHORITY: string;
  readonly VITE_REDIRECT_URI: string;

  // Swagger
  readonly VITE_APP_SWAGGER_BASE_URL: string;
  readonly VITE_SWAGGER_BASE_URL: string;

  // TMS
  readonly VITE_APP_TMS_BASE_URL: string;
  readonly VITE_TMS_BASE_URL: string;

  // Environment
  readonly VITE_APP_ENVIRONMENT: string;
  readonly VITE_ENVIRONMENT: string;

  // Tenant configuration
  readonly VITE_APP_CLIENT?: string;
  readonly VITE_APP_TENANT_NAME: string;
  readonly VITE_APP_TENANT_DOCTOR_FAX_NUMBER: string;
  readonly VITE_APP_TENANT_LOGO_URL: string;
  readonly VITE_APP_FAVICON_PATH: string;
  readonly VITE_APP_SITE_DESCRIPTION?: string;
  readonly VITE_APP_SITE_URL?: string;
  readonly VITE_APP_OG_IMAGE?: string;
  readonly VITE_TENANT_NAME: string;
  readonly VITE_TENANT_DOCTOR_FAX_NUMBER: string;
  readonly VITE_TENANT_LOGO_URL: string;
  readonly VITE_FAVICON_PATH: string;

  // Upload configuration
  readonly VITE_APP_MAX_UPLOAD_BATCH_SIZE: string;
  readonly VITE_MAX_UPLOAD_BATCH_SIZE: string;


  // Monitoring
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_SENTRY_ENVIRONMENT: string;

  // Feature flags
  readonly VITE_APP_ENABLE_QURA_AI: string;
  readonly VITE_ENABLE_QURA_AI: string;

  // Version
  readonly VITE_APP_VERSION: string;
  readonly VITE_VERSION: string;

  // Build configuration
  readonly GENERATE_SOURCEMAP: string;

  // MDX Component gallery (dev only)
  readonly VITE_ENABLE_COMPONENT_GALLERY?: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


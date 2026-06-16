import 'i18next';

import type { LOCALES } from '@locales';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: (typeof LOCALES)['EN'];
  }
}

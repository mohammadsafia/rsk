// @vitest-environment happy-dom
import { describe, expect, it } from 'vite-plus/test';

import { APP_MENU, FULL_ROUTES_PATH, patientPath } from '@routes';

describe('clinic routes', () => {
  it('adds Patients to the main menu and builds profile paths', () => {
    expect(APP_MENU.find((item) => item.id === 'patients')?.path).toBe('/patients');
    expect(FULL_ROUTES_PATH.PATIENTS.NEW).toBe('/patients/new');
    expect(patientPath('pt-001')).toBe('/patients/pt-001');
  });
});

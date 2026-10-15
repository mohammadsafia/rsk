// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { SEMANTIC_COLOR_ROLES, TEXT_SCALE } from '@constants';

import { ColorRoles, FoundationScales, TypeScale } from '@component-docs/foundations';

afterEach(cleanup);

describe('ColorRoles', () => {
  it('renders a light and a dark panel', () => {
    const { container } = render(<ColorRoles />);
    const panels = container.querySelectorAll('[data-slot="color-roles-panel"]');
    expect([...panels].map((panel) => panel.classList.contains('light') || panel.classList.contains('dark'))).toEqual([true, true]);
  });

  it('renders one swatch per role in each mode', () => {
    const { container } = render(<ColorRoles />);
    expect(container.querySelectorAll('[data-slot="color-role-swatch"]')).toHaveLength(SEMANTIC_COLOR_ROLES.length * 2);
  });
});

describe('TypeScale', () => {
  it('renders an English and an Arabic sample per step', () => {
    const { container } = render(<TypeScale />);
    expect(container.querySelectorAll('[data-slot="type-scale-row"]')).toHaveLength(TEXT_SCALE.length);
    expect(container.querySelectorAll('[dir="rtl"]')).toHaveLength(TEXT_SCALE.length);
  });
});

describe('FoundationScales', () => {
  it('renders the radius, size, elevation, motion and state sections', () => {
    const { container } = render(<FoundationScales />);
    const sections = [...container.querySelectorAll('[data-slot="foundation-scale-section"]')].map((section) =>
      section.getAttribute('data-section'),
    );
    expect(sections).toEqual(['radius', 'control-size', 'elevation', 'motion', 'states']);
  });
});

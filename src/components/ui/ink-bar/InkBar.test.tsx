// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import { Pagination, Tabs, ToggleGroup, Tooltip } from '@components/ui';

import '../../../i18n';

// happy-dom has no layout: read geometry from data attributes.
const descriptors = ['offsetLeft', 'offsetWidth'].map((key) => [key, Object.getOwnPropertyDescriptor(HTMLElement.prototype, key)] as const);
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
    configurable: true,
    get() {
      return Number((this as HTMLElement).dataset.testLeft ?? 0);
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get() {
      return Number((this as HTMLElement).dataset.testWidth ?? 0);
    },
  });
});
afterAll(() => descriptors.forEach(([key, descriptor]) => descriptor && Object.defineProperty(HTMLElement.prototype, key, descriptor)));

const reduceMotion = () =>
  vi
    .spyOn(window, 'matchMedia')
    .mockImplementation(
      (query: string) =>
        ({ matches: query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
    );

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const renderTabs = () =>
  render(
    <Tabs defaultValue="a">
      <Tabs.List>
        <Tabs.Trigger value="a" data-test-left="0" data-test-width="60">
          Overview
        </Tabs.Trigger>
        <Tabs.Trigger value="b" data-test-left="200" data-test-width="80">
          Notes
        </Tabs.Trigger>
      </Tabs.List>
    </Tabs>,
  );

describe('InkBar', () => {
  it('renders one decorative bar per tab list, placed on the active tab at mount', async () => {
    renderTabs();
    const bars = document.querySelectorAll<HTMLElement>('[data-slot="ink-bar"]');
    expect(bars).toHaveLength(1);
    expect(bars[0].getAttribute('aria-hidden')).toBe('true');
    await waitFor(() => expect([bars[0].style.left, bars[0].style.width]).toEqual(['0px', '60px']));
    expect(screen.getAllByRole('tab').some((tab) => tab.className.includes('ink-block'))).toBe(false);
  });

  it('jumps to the newly selected tab under reduced motion', async () => {
    reduceMotion();
    renderTabs();
    const bar = document.querySelector<HTMLElement>('[data-slot="ink-bar"]')!;
    const notes = screen.getByRole('tab', { name: 'Notes' });
    act(() => {
      fireEvent.mouseDown(notes);
      fireEvent.click(notes);
    });
    await waitFor(() => expect([bar.style.left, bar.style.width]).toEqual(['200px', '80px']));
  });

  it('also marks the current page and the pressed toggle, without ink-block', () => {
    render(
      <Tooltip.Provider>
        <Pagination>
          <Pagination.List>
            <Pagination.Item>
              <Pagination.NavButton>1</Pagination.NavButton>
            </Pagination.Item>
            <Pagination.Item>
              <Pagination.NavButton isActive>2</Pagination.NavButton>
            </Pagination.Item>
          </Pagination.List>
        </Pagination>
        <ToggleGroup type="single" defaultValue="a" aria-label="View">
          <ToggleGroup.Item value="a">A</ToggleGroup.Item>
          <ToggleGroup.Item value="b">B</ToggleGroup.Item>
        </ToggleGroup>
      </Tooltip.Provider>,
    );
    expect(document.querySelectorAll('[data-slot="ink-bar"]')).toHaveLength(2);
    expect(document.querySelector('[aria-current="page"]')?.className).not.toContain('ink-block');
    expect(document.querySelector('[data-state="on"]')?.className).not.toContain('ink-block');
  });
});

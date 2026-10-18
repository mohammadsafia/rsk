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
  it('follows the active item when its label changes size (fonts, a language switch), at once and without a click', async () => {
    renderTabs();
    const bar = document.querySelector<HTMLElement>('[data-slot="ink-bar"]')!;
    await waitFor(() => expect(bar.style.width).toBe('60px'));
    const active = screen.getByRole('tab', { name: 'Overview' });
    active.dataset.testWidth = '96';
    act(() => {
      active.textContent = 'نظرة عامة';
    });
    await waitFor(() => expect([bar.style.left, bar.style.width]).toEqual(['0px', '96px']));
  });

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

  it('travels with one WAAPI animation from where the bar is, and rests on the new item', async () => {
    const animate = vi.fn(() => ({ cancel() {}, finished: Promise.resolve() }));
    Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;
    renderTabs();
    const bar = document.querySelector<HTMLElement>('[data-slot="ink-bar"]')!;
    await waitFor(() => expect(bar.style.width).toBe('60px'));
    expect(animate).not.toHaveBeenCalled(); // first placement is instant
    const notes = screen.getByRole('tab', { name: 'Notes' });
    act(() => {
      fireEvent.mouseDown(notes);
      fireEvent.click(notes);
    });
    await waitFor(() => expect(animate).toHaveBeenCalledTimes(1));
    const [frames, options] = animate.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
    expect(frames[0]).toMatchObject({ left: '0px', width: '60px' });
    expect(frames.at(-1)).toMatchObject({ left: '200px', width: '80px' });
    expect(options.easing).toBe('linear');
    expect([bar.style.left, bar.style.width]).toEqual(['200px', '80px']);
  });

  it('starts an interrupted move from the position the running animation has reached', async () => {
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ cancel, finished: new Promise(() => {}) }));
    Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;
    renderTabs();
    const bar = document.querySelector<HTMLElement>('[data-slot="ink-bar"]')!;
    await waitFor(() => expect(bar.style.width).toBe('60px'));
    const notes = screen.getByRole('tab', { name: 'Notes' });
    act(() => {
      fireEvent.mouseDown(notes);
      fireEvent.click(notes);
    });
    await waitFor(() => expect(animate).toHaveBeenCalledTimes(1));
    // Mid-flight: the computed style is where the animation has the bar now.
    const computed = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) =>
      element === bar ? ({ left: '120px', width: '90px' } as CSSStyleDeclaration) : computed(element),
    );
    const overview = screen.getByRole('tab', { name: 'Overview' });
    act(() => {
      fireEvent.mouseDown(overview);
      fireEvent.click(overview);
    });
    await waitFor(() => expect(animate).toHaveBeenCalledTimes(2));
    expect(cancel).toHaveBeenCalled();
    const [frames] = animate.mock.calls[1] as unknown as [Keyframe[]];
    expect(frames[0]).toMatchObject({ left: '120px', width: '90px' });
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

// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';
import { ThemeProvider } from '@contexts';
import { useDirection } from '@radix-ui/react-direction';

import { DoDont, Example, PropsTable } from '@component-docs/blocks';

import i18n from '../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

const renderExample = () =>
  render(
    <Tooltip.Provider>
      <Example title="Variants" code="<Button>Solid</Button>">
        <button type="button">Solid</button>
      </Example>
      <Example title="Sizes" code="<Button size='sm' />">
        <button type="button">Small</button>
      </Example>
    </Tooltip.Provider>,
  );

describe('Example', () => {
  it('shows the preview first and the captured code on the Code tab', () => {
    renderExample();
    const first = document.querySelectorAll('[data-slot="docs-example"]')[0] as HTMLElement;
    expect(first.querySelector('[data-slot="docs-example-preview"]')?.textContent).toContain('Solid');
    fireEvent.mouseDown(screen.getAllByRole('tab', { name: 'Code' })[0]);
    fireEvent.click(screen.getAllByRole('tab', { name: 'Code' })[0]);
    expect(first.querySelector('pre')?.textContent).toContain('<Button>Solid</Button>');
    expect(first.querySelector('pre')?.getAttribute('dir')).toBe('ltr');
  });

  it('scopes the RTL and dark toggles to its own preview', () => {
    renderExample();
    const [first, second] = [...document.querySelectorAll('[data-slot="docs-example-preview"]')] as HTMLElement[];
    fireEvent.click(screen.getAllByRole('button', { name: 'RTL' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Dark' })[0]);
    expect(first.getAttribute('dir')).toBe('rtl');
    // The app defaults to dark, so the first click flips this preview to light.
    expect(first.className).toMatch(/(^|\s)light(\s|$)/);
    expect(second.getAttribute('dir')).toBe('ltr');
    expect(second.className).not.toMatch(/(^|\s)(dark|light)(\s|$)/);
    expect(document.documentElement.getAttribute('dir')).not.toBe('rtl');
  });

  it('previews in the app direction by default, so Arabic readers see components right to left', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderExample();
    const [first] = document.querySelectorAll('[data-slot="docs-example-preview"]');
    const [rtlToggle] = screen.getAllByRole('button', { name: 'من اليمين' });

    expect(first.getAttribute('dir')).toBe('rtl');
    expect(rtlToggle.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(rtlToggle);
    expect(first.getAttribute('dir')).toBe('ltr');
  });

  it('reports the app theme on the Dark toggle and flips away from it on the first click', () => {
    document.documentElement.classList.add('dark');
    render(
      <ThemeProvider defaultTheme="dark" storageKey="docs-example-test-theme">
        <Tooltip.Provider>
          <Example title="Themed" code="<b />">
            <b>x</b>
          </Example>
        </Tooltip.Provider>
      </ThemeProvider>,
    );
    const toggle = screen.getByRole('button', { name: 'Dark' });
    const preview = document.querySelector('[data-slot="docs-example-preview"]')!;

    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(toggle);
    expect(preview.classList.contains('light')).toBe(true);
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    document.documentElement.classList.remove('dark');
  });

  it('gives the preview its own Radix direction, so keyboard order follows the RTL toggle', () => {
    const Probe = () => <span data-testid="probe">{useDirection()}</span>;
    render(
      <Tooltip.Provider>
        <Example title="Direction" code="<Probe />">
          <Probe />
        </Example>
      </Tooltip.Provider>,
    );
    expect(screen.getByTestId('probe').textContent).toBe('ltr');
    fireEvent.click(screen.getByRole('button', { name: 'RTL' }));
    expect(screen.getByTestId('probe').textContent).toBe('rtl');
  });

  it('copies the code', async () => {
    const writes: string[] = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text: string) => void writes.push(text) },
    });
    renderExample();
    await act(async () => fireEvent.click(screen.getAllByRole('button', { name: 'Copy code' })[0]));
    expect(writes).toEqual(['<Button>Solid</Button>']);
  });
});

describe('PropsTable and DoDont', () => {
  it('renders props with mono names and a required badge, in the kit table', () => {
    render(
      <PropsTable
        rows={[{ prop: 'variant', type: "'solid' | 'outline'", default: "'solid'", description: 'Visual style.', required: true }]}
      />,
    );
    expect(document.querySelector('table')?.getAttribute('data-slot')).toBe('table');
    expect(screen.getByText('variant').className).toContain('font-mono');
    expect(screen.getByText('Required')).toBeTruthy();
  });

  it('labels Do and Don’t in Arabic', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(<DoDont do={<span>a</span>} dont={<span>b</span>} />);
    expect(screen.getByText('افعل')).toBeTruthy();
    expect(screen.getByText('لا تفعل')).toBeTruthy();
  });
});

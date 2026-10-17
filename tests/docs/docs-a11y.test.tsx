// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { PropsTable } from '../../src/component-docs/blocks/PropsTable';
import { CodeBlock } from '../../src/component-docs/code-block';
import { DocsProse } from '../../src/component-docs/docs-prose';

afterEach(cleanup);

describe('docs accessibility (axe sweep findings)', () => {
  it('prose links are underlined, not told apart by colour alone (WCAG 1.4.1)', () => {
    const { container } = render(
      <DocsProse>
        <p>
          See <a href="/docs">Dialog</a>.
        </p>
      </DocsProse>,
    );
    expect((container.firstElementChild as HTMLElement).className).toMatch(/\[&>p_a\]:underline(?![-\w])/);
  });

  it('scrollable props tables and code blocks can be reached by keyboard (WCAG 2.1.1)', () => {
    render(
      <Tooltip.Provider>
        <PropsTable rows={[{ prop: 'size', type: "'sm' | 'md'", description: 'Size' }]} />
        <CodeBlock>{'const a = 1;'}</CodeBlock>
      </Tooltip.Provider>,
    );
    expect(document.querySelector('[data-slot="docs-props"]')?.getAttribute('tabindex')).toBe('0');
    expect(document.querySelector('pre')?.getAttribute('tabindex')).toBe('0');
  });
});

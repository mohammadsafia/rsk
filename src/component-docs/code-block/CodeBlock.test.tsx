// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { CodeBlock } from './CodeBlock';

import i18n from '../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('CodeBlock', () => {
  it('stays left-to-right in mono under Arabic, with a named copy button', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(
      <Tooltip.Provider>
        <CodeBlock>
          <code>{'<Button tone="danger">Delete</Button>'}</code>
        </CodeBlock>
      </Tooltip.Provider>,
    );
    const pre = document.querySelector('pre') as HTMLElement;
    expect(pre.getAttribute('dir')).toBe('ltr');
    expect(pre.className).toContain('text-start');
    expect(pre.className).toContain('font-mono');
    expect(screen.getByRole('button', { name: i18n.t('components:code.copy') })).toBeTruthy();
    expect(document.body.innerHTML).not.toMatch(/(?<!code-)(foreground|muted)|primary|gradient|backdrop-blur|shadow-\[/);
  });
});

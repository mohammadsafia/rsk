// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { getComponentDocsRegistry } from '@component-docs/registry';
import { mdxComponents } from '@component-docs/gallery/utils';
import { MDXProvider } from '@mdx-js/react';

import '../../i18n';

afterEach(cleanup);

describe('MDX docs', () => {
  it('render GitHub-flavoured tables (API sections)', async () => {
    const docs = getComponentDocsRegistry();
    const entry = docs.find((doc) => doc.id === 'logo');
    expect(entry, docs.map((doc) => doc.id).join(',')).toBeDefined();
    const { default: Doc } = await entry!.load();
    render(
      <Tooltip.Provider>
        <MDXProvider components={mdxComponents}>
          <Doc />
        </MDXProvider>
      </Tooltip.Provider>,
    );
    expect(document.querySelector('table th')?.textContent).toBe('Prop');
    expect(document.querySelector('table')?.getAttribute('data-slot')).toBe('table');
    const inline = [...document.querySelectorAll('code')].find((node) => !node.closest('pre'));
    expect(inline?.getAttribute('dir')).toBe('ltr');
  });

  it('does not register the docs:new template as a component', () => {
    expect(getComponentDocsRegistry().some((doc) => doc.id === 'component-id')).toBe(false);
  });
});

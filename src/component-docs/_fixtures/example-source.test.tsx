// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import Fixture, { headings } from './example-source.mdx';

afterEach(cleanup);

const Example = ({ title, code, children }: { title: string; code: string; children: ReactNode }) => (
  <figure data-title={title} data-code={code}>
    {children}
  </figure>
);

describe('remark-docs through the real MDX pipeline', () => {
  it('passes captured and explicit code to Example and ids to headings', () => {
    render(<Fixture components={{ Example }} />);
    const [plain, helper] = [...document.querySelectorAll('figure')];
    expect(plain.getAttribute('data-code')).toBe('<strong>Solid</strong>');
    expect(helper.getAttribute('data-code')).toBe('<Counter />');
    expect(document.querySelector('h2')?.id).toBe('variants');
    expect(headings).toEqual([{ depth: 2, text: 'Variants', slug: 'variants' }]);
  });
});

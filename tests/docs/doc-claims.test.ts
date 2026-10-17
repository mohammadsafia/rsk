import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const page = (path: string) => readFileSync(fileURLToPath(new URL(`../../src/component-docs/${path}`, import.meta.url)), 'utf8');

// Claims a review found wrong against the component source; pinned so they don't come back.
describe('docs claims match the components', () => {
  it('Button: a loading button hides its label (visibility), so it is announced by the spinner', () => {
    const text = page('ui/Button.mdx');
    expect(text).not.toMatch(/label stays readable by screen readers/);
    expect(text).toMatch(/aria-busy/);
  });

  it('ConfirmDialog: the layout is centred, so nothing mirrors', () => {
    expect(page('shared/ConfirmDialog.mdx')).not.toMatch(/icon sits at the start of the title/);
  });

  it('Select: the check mark sits at the end of each item', () => {
    expect(page('ui/Select.mdx')).not.toMatch(/check mark at the start/);
  });

  it("DonutChart: slices start at 3 o'clock (recharts default), not at the top", () => {
    expect(page('charts/DonutChart.mdx')).not.toMatch(/Slices start at the top/);
  });

  it('chart pages say percent expects fractions', () => {
    for (const name of ['LineChart', 'AreaChart', 'BarChart']) expect(page(`charts/${name}.mdx`)).toMatch(/percent.*fraction/i);
  });
});

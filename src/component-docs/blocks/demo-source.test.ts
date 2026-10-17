import { describe, expect, it } from 'vite-plus/test';

import { demoSource } from './demo-source';

const SOURCE = `import { useState } from 'react';

export function FirstDemo() {
  const [open, setOpen] = useState(false);
  return <Button onClick={() => setOpen(!open)}>Toggle</Button>;
}

const helper = 1;

export function SecondDemo() {
  return <Input />;
}
`;

describe('demoSource', () => {
  it('returns one demo function, stopping before the next top-level declaration', () => {
    expect(demoSource('FirstDemo', SOURCE)).toBe(`export function FirstDemo() {
  const [open, setOpen] = useState(false);
  return <Button onClick={() => setOpen(!open)}>Toggle</Button>;
}`);
  });

  it('returns the last demo up to the end of the file', () => {
    expect(demoSource('SecondDemo', SOURCE)).toBe(`export function SecondDemo() {
  return <Input />;
}`);
  });

  it('also reads `export const Name = () =>` demos, as declared in MDX files', () => {
    const mdx = `import { useState } from 'react';

export const OPTIONS = ['a'];

export const PickerDemo = () => {
  const [value, setValue] = useState();
  return <Picker value={value} onChange={setValue} />;
};

## Heading
`;
    expect(demoSource('PickerDemo', mdx)).toBe(`export const PickerDemo = () => {
  const [value, setValue] = useState();
  return <Picker value={value} onChange={setValue} />;
};`);
  });

  it('throws for an unknown demo so a renamed demo fails loudly', () => {
    expect(() => demoSource('MissingDemo', SOURCE)).toThrow(/MissingDemo/);
  });

  it('reads the real demos file by default', () => {
    expect(demoSource('FormBasicDemo')).toContain('<FormInput');
  });
});

import { describe, expect, it } from 'vite-plus/test';

import remarkDocs, { slugify } from '../../scripts/docs/remark-docs';

const SOURCE = [
  '## Variants',
  '',
  '<Example title="Variants">',
  '  <Button>Solid</Button>',
  '  <Button',
  '    variant="outline"',
  '  >{label}</Button>',
  '</Example>',
  '',
  '## Variants',
].join('\n');

const at = (text: string) => {
  const start = SOURCE.indexOf(text);
  return { start: { offset: start }, end: { offset: start + text.length } };
};

const tree = () => ({
  type: 'root',
  children: [
    { type: 'heading', depth: 2, children: [{ type: 'text', value: 'Variants' }], data: {} },
    {
      type: 'mdxJsxFlowElement',
      name: 'Example',
      attributes: [{ type: 'mdxJsxAttribute', name: 'title', value: 'Variants' }],
      position: at(SOURCE.slice(SOURCE.indexOf('<Example'), SOURCE.indexOf('</Example>') + 10)),
      children: [
        { type: 'mdxJsxFlowElement', name: 'Button', position: at('<Button>Solid</Button>'), children: [] },
        { type: 'mdxJsxFlowElement', name: 'Button', position: at('<Button\n    variant="outline"\n  >{label}</Button>'), children: [] },
      ],
    },
    { type: 'heading', depth: 2, children: [{ type: 'text', value: 'Variants' }], data: {} },
  ],
});

describe('remark-docs', () => {
  it('captures the dedented children source of an Example as its code prop', () => {
    const root = tree();
    remarkDocs()(root as never, { value: SOURCE } as never);
    const code = (root.children[1] as { attributes: Array<{ name: string; value: string }> }).attributes.find((a) => a.name === 'code');
    expect(code?.value).toBe('<Button>Solid</Button>\n<Button\n  variant="outline"\n>{label}</Button>');
  });

  it('keeps an explicit code prop', () => {
    const root = tree();
    (root.children[1] as { attributes: unknown[] }).attributes.push({ type: 'mdxJsxAttribute', name: 'code', value: 'custom' });
    remarkDocs()(root as never, { value: SOURCE } as never);
    const codes = (root.children[1] as { attributes: Array<{ name: string; value: string }> }).attributes.filter((a) => a.name === 'code');
    expect(codes.map((a) => a.value)).toEqual(['custom']);
  });

  it('gives headings unique slug ids and exports the list', () => {
    const root = tree();
    remarkDocs()(root as never, { value: SOURCE } as never);
    const ids = root.children.filter((n) => n.type === 'heading').map((n) => (n.data as { hProperties: { id: string } }).hProperties.id);
    expect(ids).toEqual(['variants', 'variants-2']);
    const exported = root.children.at(-1) as unknown as { type: string; value: string };
    expect(exported.type).toBe('mdxjsEsm');
    expect(exported.value).toContain(
      'export const headings = [{"depth":2,"text":"Variants","slug":"variants"},{"depth":2,"text":"Variants","slug":"variants-2"}]',
    );
  });

  it('slugifies punctuation, accents and Arabic-free ascii', () => {
    const seen = new Map<string, number>();
    expect(slugify('With icon & label', seen)).toBe('with-icon-label');
    expect(slugify('RTL notes', seen)).toBe('rtl-notes');
    expect(slugify('API', seen)).toBe('api');
  });
});

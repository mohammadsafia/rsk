/**
 * remark-docs — one pass over each docs MDX file:
 * 1. <Example> without `code` gets the dedented source of its children as `code` (Preview · Code always match).
 * 2. h2/h3 headings get stable slug ids (outline, anchors, search).
 * 3. `export const headings = [...]` for the docs search index.
 */
type Position = { start: { offset?: number }; end: { offset?: number } };
type Node = {
  type: string;
  name?: string;
  depth?: number;
  value?: string;
  children?: Node[];
  attributes?: Attr[];
  position?: Position;
  data?: Record<string, unknown>;
};
type Attr = { type: 'mdxJsxAttribute'; name: string; value: unknown };
type File = { value: unknown };

export const slugify = (text: string, seen: Map<string, number>): string => {
  const base =
    text
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') || 'section';
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
};

const textOf = (node: Node): string =>
  node.type === 'text' || node.type === 'inlineCode' ? (node.value ?? '') : (node.children ?? []).map(textOf).join('');

const dedent = (source: string): string => {
  const lines = source.replace(/^\n+|\s+$/g, '').split('\n');
  const indents = lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => line.match(/^ */)![0].length);
  const cut = indents.length > 0 ? Math.min(...indents) : 0;
  // The first line starts at the child's own offset, so it carries no indentation.
  return [lines[0], ...lines.slice(1).map((line) => line.slice(Math.min(cut, line.match(/^ */)![0].length)))].join('\n');
};

const walk = (node: Node, visit: (node: Node) => void) => {
  visit(node);
  node.children?.forEach((child) => walk(child, visit));
};

const literal = (value: unknown): unknown => {
  if (Array.isArray(value)) return { type: 'ArrayExpression', elements: value.map(literal) };
  if (value && typeof value === 'object') {
    return {
      type: 'ObjectExpression',
      properties: Object.entries(value).map(([key, inner]) => ({
        type: 'Property',
        kind: 'init',
        method: false,
        shorthand: false,
        computed: false,
        key: { type: 'Identifier', name: key },
        value: literal(inner),
      })),
    };
  }
  return { type: 'Literal', value };
};

export default function remarkDocs() {
  return (tree: Node, file: File) => {
    const source = String(file.value ?? '');
    const seen = new Map<string, number>();
    const headings: Array<{ depth: number; text: string; slug: string }> = [];

    walk(tree, (node) => {
      if (node.type === 'mdxJsxFlowElement' && node.name === 'Example' && !node.attributes?.some((attr) => attr.name === 'code')) {
        const children = node.children ?? [];
        const start = children[0]?.position?.start.offset;
        const end = children.at(-1)?.position?.end.offset;
        if (start !== undefined && end !== undefined) {
          (node.attributes ??= []).push({ type: 'mdxJsxAttribute', name: 'code', value: dedent(source.slice(start, end)) });
        }
      }

      if (node.type === 'heading' && (node.depth === 2 || node.depth === 3)) {
        const text = textOf(node).trim();
        const slug = slugify(text, seen);
        node.data = { ...node.data, hProperties: { ...((node.data?.hProperties as object) ?? {}), id: slug } };
        headings.push({ depth: node.depth, text, slug });
      }
    });

    const value = `export const headings = ${JSON.stringify(headings)}`;
    tree.children?.push({
      type: 'mdxjsEsm',
      value,
      data: {
        estree: {
          type: 'Program',
          sourceType: 'module',
          body: [
            {
              type: 'ExportNamedDeclaration',
              specifiers: [],
              source: null,
              declaration: {
                type: 'VariableDeclaration',
                kind: 'const',
                declarations: [{ type: 'VariableDeclarator', id: { type: 'Identifier', name: 'headings' }, init: literal(headings) }],
              },
            },
          ],
        },
      },
    });
  };
}

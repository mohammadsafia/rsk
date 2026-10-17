import demos from '@pages/components/components.data.demos?raw';

// The next top-level declaration, or (in MDX) the next heading or JSX block.
const NEXT_DECLARATION = /\n(?:(?:export\s+)?(?:async\s+)?(?:function|const|let|type|interface|class)\s|#{1,6}\s|<[A-Z])/;

/**
 * The source of one demo, for an <Example code={…}> whose preview renders that demo. Reads
 * components.data.demos.tsx by default, or any raw source (e.g. an MDX page's own `?raw` import for
 * `export const Demo = () => …`). Keeps the Code tab identical to what the Preview runs. Docs are
 * dev-only, so the raw import never ships.
 */
export function demoSource(name: string, source: string = demos): string {
  const match = new RegExp(`export (?:function ${name}\\(|const ${name} =)`).exec(source);
  const start = match?.index ?? -1;
  if (start === -1) throw new Error(`demoSource: no demo named "${name}"`);

  const rest = source.slice(start);
  const end = rest.slice(1).search(NEXT_DECLARATION);
  return (end === -1 ? rest : rest.slice(0, end + 1)).trimEnd();
}

import demos from '@pages/components/components.data.demos?raw';

const NEXT_DECLARATION = /\n(?:export\s+)?(?:async\s+)?(?:function|const|let|type|interface|class)\s/;

/**
 * The source of one demo from components.data.demos.tsx, for an <Example code={…}> whose preview renders
 * that demo. Reading the file keeps the Code tab identical to what the Preview runs. Docs are dev-only,
 * so the raw import never ships.
 */
export function demoSource(name: string, source: string = demos): string {
  const start = source.indexOf(`export function ${name}(`);
  if (start === -1) throw new Error(`demoSource: no demo named "${name}"`);

  const rest = source.slice(start);
  const end = rest.slice(1).search(NEXT_DECLARATION);
  return (end === -1 ? rest : rest.slice(0, end + 1)).trimEnd();
}

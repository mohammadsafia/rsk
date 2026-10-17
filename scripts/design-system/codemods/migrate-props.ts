/**
 * Rewrites literal JSX props at call sites according to per-component rules.
 * Expression-valued props and rule-declared edge cases are reported for manual migration.
 */

export type AttrValue = string | true;

export type TagRule = {
  tag: string;
  renameTo?: string;
  importRename?: { source: string; from: string; to: string };
  keys: ReadonlyArray<string>;
  transform: (attrs: Readonly<Record<string, string>>) => Record<string, AttrValue> | 'manual';
};

const QUOTES = new Set(['"', "'", '`']);

function findTagEnd(source: string, from: number): number {
  let depth = 0;
  let quote: string | null = null;

  for (let index = from; index < source.length; index++) {
    const char = source[index];
    if (quote) {
      if (char === quote && source[index - 1] !== '\\') quote = null;
      continue;
    }
    if (QUOTES.has(char)) quote = char;
    else if (char === '{') depth++;
    else if (char === '}') depth--;
    else if (char === '>' && depth === 0) return index;
  }

  return -1;
}

/** Replaces everything inside {…} with spaces (same length) so attribute regexes only see top-level syntax. */
function maskExpressions(text: string): string {
  let depth = 0;
  let masked = '';
  for (const char of text) {
    if (char === '{') {
      depth++;
      masked += ' ';
    } else if (char === '}') {
      depth--;
      masked += ' ';
    } else masked += depth > 0 ? ' ' : char;
  }
  return masked;
}

const serialize = (attrs: Record<string, AttrValue>) =>
  Object.entries(attrs)
    .map(([name, value]) => (value === true ? ` ${name}` : ` ${name}="${value}"`))
    .join('');

function renameImport(source: string, { source: from, from: oldName, to: newName }: NonNullable<TagRule['importRename']>): string {
  const pattern = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*'${from.replace(/[/@]/g, (c) => `\\${c}`)}'`, 'g');
  return source.replace(pattern, (statement: string, names: string) => {
    const list = names
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    if (!list.includes(oldName)) return statement;
    const next = [...new Set(list.map((name) => (name === oldName ? newName : name)))];
    return statement.replace(names, ` ${next.join(', ')} `);
  });
}

export function migrateSource(
  source: string,
  rules: ReadonlyArray<TagRule>,
  file = '<source>',
): { output: string; changed: number; manual: string[] } {
  let output = source;
  let changed = 0;
  const manual: string[] = [];

  for (const rule of rules) {
    const opening = new RegExp(`<${rule.tag.replace('.', '\\.')}(?=[\\s/>])`, 'g');
    let match: RegExpExecArray | null;
    let cursor = 0;
    let rebuilt = '';

    while ((match = opening.exec(output))) {
      const headStart = match.index + match[0].length;
      const end = findTagEnd(output, headStart);
      if (end < 0) break;

      const head = output.slice(headStart, end);
      const masked = maskExpressions(head);
      const literal = new Map<string, { value: string; start: number; end: number }>();
      for (const attr of masked.matchAll(/\s([A-Za-z][\w-]*)="([^"]*)"/g)) {
        literal.set(attr[1], { value: attr[2], start: attr.index ?? 0, end: (attr.index ?? 0) + attr[0].length });
      }
      const expressionKeys = [...masked.matchAll(/\s([A-Za-z][\w-]*)=(?=\s)/g)].map((attr) => attr[1]);

      const tagName = rule.renameTo ?? rule.tag;
      const line = output.slice(0, match.index).split('\n').length;
      const managed = Object.fromEntries(rule.keys.filter((key) => literal.has(key)).map((key) => [key, literal.get(key)!.value]));
      const result = rule.keys.some((key) => expressionKeys.includes(key)) ? 'manual' : rule.transform(managed);

      let newHead = head;
      if (result === 'manual') {
        manual.push(`${file}:${line} <${rule.tag}${head.replace(/\s+/g, ' ')}>`);
      } else {
        const removals = rule.keys
          .filter((key) => literal.has(key))
          .map((key) => literal.get(key)!)
          .sort((a, b) => b.start - a.start);
        for (const { start, end: attrEnd } of removals) newHead = newHead.slice(0, start) + newHead.slice(attrEnd);
        newHead = serialize(result) + newHead;
        changed++;
      }

      rebuilt += output.slice(cursor, match.index) + `<${tagName}` + newHead;
      cursor = end;
      opening.lastIndex = end;
    }

    output = rebuilt + output.slice(cursor);
    if (rule.renameTo) {
      output = output.replaceAll(`</${rule.tag}>`, `</${rule.renameTo}>`);
      if (rule.importRename) output = renameImport(output, rule.importRename);
    }
  }

  return { output, changed, manual };
}

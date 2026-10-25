import type { CSSProperties, ReactElement } from 'react';

import type { LanguageDirection } from '@constants';

// next/og (satori) shapes Arabic letters but lays words out left to right, ignoring `dir`. Right-to-left text is drawn
// here as a row of runs laid from the right, which wraps lines in reading order.

const ARABIC = '\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF\\u200C\\u200D';
const TOKENS = new RegExp(`[${ARABIC}]+|[\\p{L}\\p{N}]+|\\s+|[^\\s\\p{L}\\p{N}]`, 'gu');
const IS_ARABIC = new RegExp(`^[${ARABIC}]`);
const IS_LATIN = /^[\p{L}\p{N}]/u;

/**
 * Text in logical order, cut into the runs a right-to-left line places from the right: each Arabic word, a whole
 * Latin phrase (with the spaces and signs inside it), a space, a punctuation mark. Text with no Arabic is one run.
 */
export function bidiRuns(text: string): string[] {
  const tokens = text.match(TOKENS) ?? [];
  if (!tokens.some((token) => IS_ARABIC.test(token))) return [text];
  const runs: string[] = [];
  for (let at = 0; at < tokens.length; at += 1) {
    const token = tokens[at];
    if (IS_LATIN.test(token) && !IS_ARABIC.test(token)) {
      // A Latin run reaches its last Latin token before the next Arabic word.
      let end = at;
      for (let next = at + 1; next < tokens.length && !IS_ARABIC.test(tokens[next]); next += 1) if (IS_LATIN.test(tokens[next])) end = next;
      runs.push(tokens.slice(at, end + 1).join(''));
      at = end;
    } else runs.push(/^\s+$/.test(token) ? ' ' : token);
  }
  return runs;
}

const SPACE: CSSProperties = { width: '0.3em' };

type OgTextProps = { text: string; dir: LanguageDirection; style?: CSSProperties };

/** A paragraph in an OG image, right to left when `dir` says so. */
export function OgText({ text, dir, style }: OgTextProps): ReactElement {
  if (dir === 'ltr') return <div style={{ display: 'flex', ...style }}>{text}</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'row-reverse', flexWrap: 'wrap', ...style }}>
      {bidiRuns(text).map((run, index) => (
        // A space is a gap of its own: satori drops a span's leading and trailing spaces.
        <span key={index} style={run === ' ' ? SPACE : undefined}>
          {run.trim()}
        </span>
      ))}
    </div>
  );
}

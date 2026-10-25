// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { bidiRuns } from './og-text';

describe('bidiRuns', () => {
  it('keeps a Latin phrase whole, splits Arabic into words, and keeps punctuation a run of its own', () => {
    expect(bidiRuns('قالب React + TypeScript لمن يقدّر.')).toEqual(['قالب', ' ', 'React + TypeScript', ' ', 'لمن', ' ', 'يقدّر', '.']);
  });

  it('separates a Latin word joined to an Arabic letter', () => {
    expect(bidiRuns('وTypeScript')).toEqual(['و', 'TypeScript']);
  });

  it('leaves text with no Arabic as one run', () => {
    expect(bidiRuns('A considered React + TypeScript starter.')).toEqual(['A considered React + TypeScript starter.']);
  });
});

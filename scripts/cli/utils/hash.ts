/**
 * Content hashing utility for change detection.
 */

import crypto from 'node:crypto';

/**
 * Compute an MD5 hash of content after normalizing whitespace and comments.
 * This allows detecting meaningful changes vs. formatting-only changes.
 */
export function computeContentHash(content: string): string {
  const normalized = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

  return crypto.createHash('md5').update(normalized).digest('hex');
}

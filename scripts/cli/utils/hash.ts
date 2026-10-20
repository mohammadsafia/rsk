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
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // A content fingerprint for change detection, not security; manifests already store MD5s, so changing it would mark
  // every generated file as hand-edited.
  return crypto.createHash('md5').update(normalized).digest('hex'); // NOSONAR
}

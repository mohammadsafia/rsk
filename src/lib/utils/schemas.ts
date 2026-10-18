import { z } from 'zod';

/** An optional email field: empty, or a valid address (trimmed). */
export const optionalEmail = (message: string) => z.union([z.literal(''), z.string().trim().pipe(z.email(message))]);

import { z } from 'zod';

/** A practical address check (something@domain.tld); the server has the last word. */
export const isEmail = (value: string): boolean => z.email().safeParse(value).success;

export type InviteSchemaMessages = { required: string; invalid: string; role: string };

export const inviteSchema = (messages: InviteSchemaMessages) =>
  z.object({
    emails: z
      .array(z.string())
      .min(1, messages.required)
      .refine((emails) => emails.every(isEmail), messages.invalid),
    role: z.string().min(1, messages.role),
  });

export type InviteForm = z.infer<ReturnType<typeof inviteSchema>>;

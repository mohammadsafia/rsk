import { zodResolver } from '@hookform/resolvers/zod';
import type { FieldValues, Resolver } from 'react-hook-form';
import type { z } from 'zod';

/**
 * A react-hook-form resolver for a Zod schema, typed by the form. Forms hold editing state the schema doesn't accept
 * as input (an empty number box is `null`), and resolvers 5 types the resolver from the schema's input and output, so
 * `useForm<Form>` would not take it. The schema still validates every submit; the form keeps one type in and out.
 */
export const formResolver = <TForm extends FieldValues>(schema: z.ZodType): Resolver<TForm> =>
  zodResolver(schema as z.ZodType<FieldValues, FieldValues>) as unknown as Resolver<TForm>;

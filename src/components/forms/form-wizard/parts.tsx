'use client';

import type { ReactNode } from 'react';
import type { ZodTypeAny } from 'zod';

export type ReviewRows = { name: string; label: string; format?: (value: unknown) => ReactNode }[];

export type FormWizardStepProps = {
  id: string;
  title: string;
  description?: string;
  /** Validates this step's values on Next; takes priority over `fields`. */
  schema?: ZodTypeAny;
  /** Field paths validated with form.trigger on Next when there is no schema. */
  fields?: string[];
  optional?: boolean;
  /** false hides the step entirely. */
  condition?: boolean;
  /** Summary rows (or a renderer) for FormWizard.Review. */
  review?: ReviewRows | ((values: Record<string, unknown>) => ReactNode);
  children?: ReactNode;
};

export type FormWizardReviewProps = { title?: string };

/** Marker: FormWizard reads its props; it renders its children only while current. */
export function FormWizardStep({ children }: FormWizardStepProps) {
  return <>{children}</>;
}

export function FormWizardReview(_props: FormWizardReviewProps) {
  return null;
}

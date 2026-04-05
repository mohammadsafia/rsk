import type { ComponentPropsWithoutRef } from 'react';

export type PreProps = ComponentPropsWithoutRef<'pre'>;

export type CategoryTab = Readonly<{
  key: string;
  label: string;
}>;

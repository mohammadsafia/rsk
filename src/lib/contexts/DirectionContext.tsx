import { type ReactNode } from 'react';
import { DirectionProvider } from '@radix-ui/react-direction';

import { useAppTranslation } from '@hooks/shared';

export function AppDirectionProvider({ children }: { children: ReactNode }) {
  const { direction } = useAppTranslation();

  return <DirectionProvider dir={direction}>{children}</DirectionProvider>;
}

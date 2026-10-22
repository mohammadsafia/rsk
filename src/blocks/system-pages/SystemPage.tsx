'use client';

import { type ReactElement, type ReactNode } from 'react';

import { Button } from '@components/ui';

import { EmptyState, Logo } from '@components/shared';
import { Conditional } from '@components/utils';

import { KitLink } from '@contexts';
import { useBlockTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { Home } from 'lucide-react';

import { LOCALE } from './locale';

/**
 * `bare`: a page of its own, with the logo and the main landmark. `app`: inside the app shell, which has both.
 * `preview`: looks like `bare` without the landmark or the full height, for showing a page inside another (the docs).
 */
export type SystemPageLayout = 'bare' | 'app' | 'preview';

export type SystemPageProps = {
  /** The status code, shown large (404, 500, 403); `icon` when there is none. */
  code?: string;
  icon?: ReactNode;
  title: string;
  description: string;
  /** `error` announces the page as an alert. @default 'first-use' */
  kind?: 'first-use' | 'error';
  layout?: SystemPageLayout;
  /** Actions before "Back to home", e.g. "Try again". */
  children?: ReactNode;
};

const HEIGHT: Record<SystemPageLayout, string> = { bare: 'min-h-dvh', app: 'min-h-[60vh]', preview: 'py-10' };

/** The layout every system page shares: logo, code, title, description, and a way back home. */
function SystemPage({ code, icon, title, description, kind = 'first-use', layout = 'bare', children }: SystemPageProps): ReactElement {
  const { t } = useBlockTranslation('block-system-pages', LOCALE);

  const Root = layout === 'bare' ? 'main' : 'div';

  return (
    <Root data-slot="system-page" className={cn('bg-canvas text-fg flex flex-col items-center justify-center gap-8 p-6', HEIGHT[layout])}>
      <Conditional.If condition={layout !== 'app'}>
        <Logo variant="lockup" size="lg" />
      </Conditional.If>

      <EmptyState
        kind={kind}
        // A preview sits under the page's own h1.
        titleAs={layout === 'preview' ? 'h2' : 'h1'}
        title={title}
        description={description}
        // The code takes the place of the icon, drawn like the kit's empty-state figure.
        icon={
          <Conditional>
            <Conditional.If condition={!!code}>
              <span className="figure text-fg rule-top relative pt-2">{code}</span>
            </Conditional.If>

            <Conditional.Else>{icon}</Conditional.Else>
          </Conditional>
        }
        className="max-w-lg [&_[data-slot=empty-state-icon]]:size-auto"
      >
        <EmptyState.Actions>
          {children}

          <Button variant={children ? 'outline' : 'solid'} asChild>
            <KitLink href="/">
              <Home aria-hidden="true" />
              {t('home')}
            </KitLink>
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    </Root>
  );
}

export default SystemPage;

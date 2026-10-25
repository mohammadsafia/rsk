'use client';

import { Avatar, Button, DropdownMenu, IconButton } from '@components/ui';
import { Conditional } from '@components/utils';
import { AppShell, LanguageSwitcher, ThemeSwitcher } from '@components/shared';

import { useCommandPalette, useKitNavigate } from '@contexts';
import { useAppTranslation, useAuth } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

import { Bell, LogOut, Search, Settings, User } from 'lucide-react';

function AppHeader() {
  const navigate = useKitNavigate();
  const { t } = useAppTranslation('header');
  const { currentUser, signOut } = useAuth();
  const { toggle } = useCommandPalette();

  return (
    <>
      <AppShell.MenuButton />

      <button
        type="button"
        onClick={toggle}
        // The visible text is the accessible name (WCAG 2.5.3); the shortcut is announced, not read as part of the name.
        aria-keyshortcuts="Meta+K Control+K"
        className="text-fg-muted bg-surface border-border hover:bg-hover hover:text-fg focus-visible:ring-ring h-control-md flex w-full max-w-xs items-center gap-2 rounded-md border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Search aria-hidden="true" className="size-4 shrink-0" />

        <span className="flex-1 truncate text-start">{t('searchPlaceholder')}</span>

        <kbd
          aria-hidden="true"
          className="bg-surface-sunken text-fg-muted border-border text-2xs pointer-events-none hidden rounded-sm border px-1.5 font-mono sm:inline-block"
        >
          ⌘K
        </kbd>
      </button>

      <div className="ms-auto flex items-center gap-1">
        <IconButton aria-label={t('notifications')}>
          <Bell aria-hidden="true" />
        </IconButton>

        <ThemeSwitcher />

        <LanguageSwitcher />

        <div aria-hidden="true" className="bg-border mx-1 hidden h-5 w-px md:block" />

        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" className="size-8 rounded-full p-0" aria-label={t('openUserMenu')}>
              <Avatar size="md">
                <Conditional.If condition={!!currentUser?.picture}>
                  <Avatar.Image src={currentUser?.picture} alt={t('avatarAlt', { name: currentUser?.name })} />
                </Conditional.If>

                <Avatar.Fallback className="text-xs">
                  <Conditional>
                    <Conditional.If condition={!!currentUser?.name}>{currentUser?.name?.charAt(0)?.toUpperCase()}</Conditional.If>

                    <Conditional.Else>
                      <User aria-hidden="true" className="size-3.5" />
                    </Conditional.Else>
                  </Conditional>
                </Avatar.Fallback>
              </Avatar>
            </Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content className="w-56" align="end">
            <DropdownMenu.Label className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-fg text-sm leading-none font-medium">{currentUser?.name}</p>

                <p className="text-fg-muted text-xs leading-none">{currentUser?.email}</p>
              </div>
            </DropdownMenu.Label>

            <DropdownMenu.Separator />

            <DropdownMenu.Group>
              <DropdownMenu.Item onClick={() => navigate(FULL_ROUTES_PATH.HOME.INDEX)}>
                <User aria-hidden="true" />
                {t('myProfile')}
              </DropdownMenu.Item>

              <DropdownMenu.Item onClick={() => navigate(FULL_ROUTES_PATH.SETTINGS.INDEX)}>
                <Settings aria-hidden="true" />
                {t('settings')}
              </DropdownMenu.Item>
            </DropdownMenu.Group>

            <DropdownMenu.Separator />

            <DropdownMenu.Item onClick={signOut}>
              <LogOut aria-hidden="true" />
              {t('logout')}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
    </>
  );
}

export default AppHeader;

'use client';

import { Command } from '@components/ui';

import { THEME_TYPES, useCommandPalette, useKitNavigate, useTheme } from '@contexts';
import { useAppTranslation, useAuth } from '@hooks/shared';

import { menuLabelKey } from '@utils';
import { APP_MENU } from '@routes';

import { LogOut, Moon, Sun } from 'lucide-react';

function CommandPalette() {
  const navigate = useKitNavigate();
  const { open, setOpen } = useCommandPalette();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const { t } = useAppTranslation('nav');

  const isDark = theme === THEME_TYPES.DARK;

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Command.Dialog title={t('commandPalette')} open={open} onOpenChange={setOpen}>
      <Command.Input placeholder={t('header:searchPlaceholder')} />

      <Command.List>
        <Command.Empty when>{t('common:noResults')}</Command.Empty>

        <Command.Group heading={t('navigation')}>
          {APP_MENU.map((route) => (
            <Command.Item key={route.id} value={t(menuLabelKey(route))} onSelect={() => runCommand(() => navigate(route.path))}>
              <route.icon className="h-4 w-4" />
              {t(menuLabelKey(route))}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Separator />

        <Command.Group heading={t('actions')}>
          <Command.Item
            value="toggle theme dark light"
            onSelect={() => runCommand(() => setTheme(isDark ? THEME_TYPES.LIGHT : THEME_TYPES.DARK))}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {t('toggleTheme')}
          </Command.Item>

          <Command.Item value="log out sign out" onSelect={() => runCommand(signOut)}>
            <LogOut className="h-4 w-4" />
            {t('header:logout')}
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}

export default CommandPalette;

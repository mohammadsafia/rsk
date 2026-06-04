import { useNavigate } from 'react-router-dom';

import { Command, Dialog } from '@components/ui';

import { THEME_TYPES, useCommandPalette, useTheme } from '@contexts';
import { useAuth } from '@hooks/shared';

import { APP_MENU } from '@routes';

import { LogOut, Moon, Sun } from 'lucide-react';

function CommandPalette() {
  const navigate = useNavigate();
  const { open, setOpen } = useCommandPalette();
  const { theme, setTheme } = useTheme();
  const { removeCurrentUser } = useAuth();

  const isDark = theme === THEME_TYPES.DARK;

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Title className="sr-only">Command palette</Dialog.Title>

      <Command.Input placeholder="Search or jump to…" />

      <Command.List>
        <Command.Empty when>No results found.</Command.Empty>

        <Command.Group heading="Navigation">
          {APP_MENU.map((route) => (
            <Command.Item key={route.id} value={route.name ?? route.path} onSelect={() => runCommand(() => navigate(route.path))}>
              <route.icon className="h-4 w-4" />
              {route.name ?? route.path}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Separator />

        <Command.Group heading="Actions">
          <Command.Item
            value="toggle theme dark light"
            onSelect={() => runCommand(() => setTheme(isDark ? THEME_TYPES.LIGHT : THEME_TYPES.DARK))}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Toggle theme
          </Command.Item>

          <Command.Item value="log out sign out" onSelect={() => runCommand(removeCurrentUser)}>
            <LogOut className="h-4 w-4" />
            Log out
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}

export default CommandPalette;

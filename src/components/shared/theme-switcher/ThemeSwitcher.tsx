import { Button } from '@components/ui';

import { THEME_TYPES, useTheme } from '@contexts';

import { Moon, Sun } from 'lucide-react';

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const isDark = theme === THEME_TYPES.DARK;

  const toggleTheme = () => setTheme(isDark ? THEME_TYPES.LIGHT : THEME_TYPES.DARK);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="text-muted-foreground hover:text-foreground relative h-9 w-9"
    >
      <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export default ThemeSwitcher;

import { Button } from '@components/ui';

import { THEME_TYPES, useTheme } from '@contexts';

import { Moon, Sun } from 'lucide-react';

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const isDark = theme === THEME_TYPES.DARK;

  const toggleTheme = () => {
    setTheme(isDark ? THEME_TYPES.LIGHT : THEME_TYPES.DARK);
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground h-9 w-9" aria-label="Toggle theme">
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export default ThemeSwitcher;

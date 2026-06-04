import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type CommandPaletteState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteState | undefined>(undefined);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((prevState) => !prevState), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  const contextValue = useMemo(() => ({ open, setOpen, toggle }), [open, toggle]);

  return <CommandPaletteContext.Provider value={contextValue}>{children}</CommandPaletteContext.Provider>;
}

export const useCommandPalette = () => {
  const context = useContext(CommandPaletteContext);

  if (context === undefined) throw new Error('useCommandPalette must be used within a CommandPaletteProvider');

  return context;
};

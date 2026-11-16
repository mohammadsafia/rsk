'use client';

import { useRef } from 'react';

type AutoFocusHandler = (event: Event) => void;

export type ReturnFocusHandlers = {
  onOpenAutoFocus?: AutoFocusHandler;
  onCloseAutoFocus?: AutoFocusHandler;
};

/**
 * Focus goes back to whatever had it when the dialog opened, however it closes (Escape, a Cancel button, its close
 * button or a state change). Radix only returns focus to a Dialog.Trigger, so a dialog or sheet opened by state (a
 * row action, a menu item, a toast, after a request) dropped focus on <body>.
 *
 * Wraps the content's own onOpenAutoFocus / onCloseAutoFocus: a caller that prevents the close event keeps control.
 * Focus is left alone when the opener has left the page (Radix then falls back to the Trigger, if any) or when focus
 * already moved somewhere else on purpose (a click outside a non-modal dialog).
 */
export function useReturnFocusOnClose({ onOpenAutoFocus, onCloseAutoFocus }: ReturnFocusHandlers): Required<ReturnFocusHandlers> {
  const openerRef = useRef<HTMLElement | null>(null);

  const handleOpenAutoFocus = (event: Event) => {
    // Runs before focus moves into the dialog, so the active element is still the one that opened it.
    const active = document.activeElement;
    openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
    onOpenAutoFocus?.(event);
  };

  const handleCloseAutoFocus = (event: Event) => {
    onCloseAutoFocus?.(event);
    const opener = openerRef.current;
    openerRef.current = null;
    if (event.defaultPrevented || !opener?.isConnected) return;

    const active = document.activeElement;
    const container = event.currentTarget instanceof Node ? event.currentTarget : null;
    const movedElsewhere = active instanceof HTMLElement && active !== document.body && !container?.contains(active);
    if (movedElsewhere) return;

    event.preventDefault();
    opener.focus({ preventScroll: true });
  };

  return { onOpenAutoFocus: handleOpenAutoFocus, onCloseAutoFocus: handleCloseAutoFocus };
}

/**
 * useCommandPalette manages the global command palette state and shortcut.
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";

export interface UseCommandPaletteReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

type CommandPaletteListener = () => void;

let isCommandPaletteOpen = false;
const commandPaletteListeners = new Set<CommandPaletteListener>();
let keyboardListenerConsumerCount = 0;

const handleCommandPaletteKeyDown = (event: KeyboardEvent): void => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    setCommandPaletteOpen(!isCommandPaletteOpen);
  }
};

const emitCommandPaletteChange = (): void => {
  commandPaletteListeners.forEach((listener) => listener());
};

const setCommandPaletteOpen = (nextOpen: boolean): void => {
  if (isCommandPaletteOpen === nextOpen) {
    return;
  }

  isCommandPaletteOpen = nextOpen;
  emitCommandPaletteChange();
};

const subscribeCommandPalette = (
  listener: CommandPaletteListener,
): (() => void) => {
  commandPaletteListeners.add(listener);

  return () => {
    commandPaletteListeners.delete(listener);
  };
};

const getCommandPaletteSnapshot = (): boolean => isCommandPaletteOpen;

export function useCommandPalette(): UseCommandPaletteReturn {
  const isOpen = useSyncExternalStore(
    subscribeCommandPalette,
    getCommandPaletteSnapshot,
    getCommandPaletteSnapshot,
  );

  const open = useCallback((): void => {
    setCommandPaletteOpen(true);
  }, []);

  const close = useCallback((): void => {
    setCommandPaletteOpen(false);
  }, []);

  const toggle = useCallback((): void => {
    setCommandPaletteOpen(!isCommandPaletteOpen);
  }, []);

  useEffect(() => {
    keyboardListenerConsumerCount += 1;

    if (keyboardListenerConsumerCount === 1) {
      window.addEventListener("keydown", handleCommandPaletteKeyDown);
    }

    return () => {
      keyboardListenerConsumerCount = Math.max(
        0,
        keyboardListenerConsumerCount - 1,
      );

      if (keyboardListenerConsumerCount === 0) {
        window.removeEventListener("keydown", handleCommandPaletteKeyDown);
      }
    };
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  callback: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find(shortcut => {
        return (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!event.ctrlKey === !!shortcut.ctrlKey &&
          !!event.altKey === !!shortcut.altKey &&
          !!event.shiftKey === !!shortcut.shiftKey
        );
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Common shortcuts for the application
export const useAppShortcuts = (callbacks: {
  onNewSale?: () => void;
  onNewProduct?: () => void;
  onSearch?: () => void;
  onSave?: () => void;
}) => {
  const shortcuts: ShortcutConfig[] = [
    {
      key: 'n',
      ctrlKey: true,
      callback: callbacks.onNewSale || (() => {}),
      description: 'New Sale (Ctrl+N)'
    },
    {
      key: 'p',
      ctrlKey: true,
      altKey: true,
      callback: callbacks.onNewProduct || (() => {}),
      description: 'New Product (Ctrl+Alt+P)'
    },
    {
      key: 'k',
      ctrlKey: true,
      callback: callbacks.onSearch || (() => {}),
      description: 'Search (Ctrl+K)'
    },
    {
      key: 's',
      ctrlKey: true,
      callback: callbacks.onSave || (() => {}),
      description: 'Save (Ctrl+S)'
    }
  ];

  useKeyboardShortcuts(shortcuts);
  return shortcuts;
};
// 快捷键系统

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export interface ShortcutConfig {
  shortcuts: Shortcut[];
}

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  {
    key: 'c',
    ctrl: true,
    description: '退出程序',
    action: () => process.exit(0),
  },
  {
    key: 'l',
    ctrl: true,
    description: '清空屏幕',
    action: () => console.clear(),
  },
  {
    key: 'n',
    description: '新建会话',
    action: () => {
      // 由 App 处理
    },
  },
  {
    key: 'h',
    description: '显示历史',
    action: () => {
      // 由 App 处理
    },
  },
  {
    key: 's',
    ctrl: true,
    description: '保存会话',
    action: () => {
      // 由 App 处理
    },
  },
];

export class ShortcutManager {
  private shortcuts: Map<string, Shortcut> = new Map();
  private active: boolean = true;

  constructor(shortcuts: Shortcut[] = DEFAULT_SHORTCUTS) {
    this.registerShortcuts(shortcuts);
  }

  registerShortcuts(shortcuts: Shortcut[]): void {
    for (const shortcut of shortcuts) {
      const key = this.formatKey(shortcut);
      this.shortcuts.set(key, shortcut);
    }
  }

  unregisterShortcut(key: string, ctrl?: boolean, alt?: boolean): void {
    const formattedKey = this.formatKey({ key, ctrl, alt });
    this.shortcuts.delete(formattedKey);
  }

  handleKey(key: string, ctrl?: boolean, alt?: boolean, shift?: boolean): boolean {
    if (!this.active) return false;

    const formattedKey = this.formatKey({ key, ctrl, alt, shift });
    const shortcut = this.shortcuts.get(formattedKey);

    if (shortcut) {
      shortcut.action();
      return true;
    }

    return false;
  }

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }

  private formatKey(shortcut: Partial<Shortcut>): string {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.key) parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  getShortcuts(): Shortcut[] {
    return Array.from(this.shortcuts.values());
  }

  getHelpText(): string {
    return this.getShortcuts()
      .map(s => {
        const modifiers: string[] = [];
        if (s.ctrl) modifiers.push('Ctrl');
        if (s.alt) modifiers.push('Alt');
        if (s.shift) modifiers.push('Shift');
        return `${modifiers.join('+')}${modifiers.length > 0 ? '+' : ''}${s.key} - ${s.description}`;
      })
      .join('\n');
  }
}

let defaultManager: ShortcutManager | null = null;

export function getShortcutManager(): ShortcutManager {
  if (!defaultManager) {
    defaultManager = new ShortcutManager();
  }
  return defaultManager;
}

export function resetShortcutManager(): void {
  defaultManager = null;
}
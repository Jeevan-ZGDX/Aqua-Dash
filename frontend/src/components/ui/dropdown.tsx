'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';

export interface MenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  separator?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

export interface DropdownProps {
  trigger: ReactNode;
  items?: MenuItem[];
  children?: ReactNode;
  align?: 'start' | 'end';
  width?: 'auto' | 'sm' | 'md';
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

const widths = { auto: 'w-auto', sm: 'w-48', md: 'w-60' };

export function Dropdown({ trigger, items, children, align = 'end', width = 'sm', className, onOpenChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (triggerRef.current && triggerRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const toggle = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setAnchorRect(rect);
    const next = !open;
    setOpen(next);
    onOpenChange?.(next);
  };

  const handleSelect = (item: MenuItem) => {
    item.onSelect?.();
    setOpen(false);
  };

  const menuWidth = widths[width];

  return (
    <>
      <div ref={triggerRef} className="inline-block">
        <div onClick={toggle} className="cursor-pointer">
          {trigger}
        </div>
      </div>
      {open &&
        anchorRect &&
        createPortal(
          <div
            className={cn('absolute z-[80] animate-fade-in-scale rounded-lg border border-border bg-popover p-1 shadow-dropdown', menuWidth, className)}
            style={{
              top: anchorRect.bottom + 6,
              left: align === 'end' ? anchorRect.right - (width === 'auto' ? anchorRect.width : widths[width] === 'w-60' ? 240 : 192) : anchorRect.left,
            }}
            role="menu"
          >
            {items &&
              items.map((item) => (
                <div key={item.key}>
                  {item.separator && <div className="my-1 h-px bg-border" />}
                  <button
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors disabled:opacity-50',
                      item.danger
                        ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                        : 'text-foreground hover:bg-accent',
                    )}
                  >
                    {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
                    {item.label}
                  </button>
                </div>
              ))}
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}

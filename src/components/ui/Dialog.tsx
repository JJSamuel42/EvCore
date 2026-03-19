'use client';

import React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RadixDialog.Root>
  );
}

export const DialogTrigger = RadixDialog.Trigger;

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  title?: string;
  description?: string;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
};

export function DialogContent({
  children,
  className,
  size = 'md',
  showClose = true,
  title,
  description,
}: DialogContentProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <RadixDialog.Content
        className={cn(
          'fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]',
          'z-50 w-full',
          sizeMap[size],
          'bg-card rounded-xl border border-border shadow-lg',
          'focus:outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2',
          'data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]',
          'max-h-[90vh] overflow-y-auto',
          className
        )}
      >
        {(title || showClose) && (
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border">
            <div>
              {title && (
                <RadixDialog.Title className="text-lg font-serif font-semibold text-foreground">
                  {title}
                </RadixDialog.Title>
              )}
              {description && (
                <RadixDialog.Description className="text-sm text-muted-foreground mt-1">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            {showClose && (
              <RadixDialog.Close className="ml-4 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent">
                <X className="w-4 h-4" />
              </RadixDialog.Close>
            )}
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export const DialogClose = RadixDialog.Close;

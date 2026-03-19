'use client';

import React from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  label,
  error,
  disabled,
  className,
  triggerClassName,
}: SelectProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
          {label}
        </label>
      )}
      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <RadixSelect.Trigger
          className={cn(
            'flex items-center justify-between w-full h-10',
            'bg-card border border-border rounded-md',
            'text-sm text-foreground',
            'px-3 py-2',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'data-[placeholder]:text-muted-foreground/60',
            error && 'border-exclude',
            triggerClassName
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className={cn(
              'overflow-hidden bg-card border border-border rounded-lg shadow-lg',
              'z-50 min-w-[8rem]',
              'animate-in fade-in-0 zoom-in-95'
            )}
            position="popper"
            sideOffset={4}
          >
            <RadixSelect.ScrollUpButton className="flex items-center justify-center h-6 cursor-default text-muted-foreground">
              <ChevronUp className="w-4 h-4" />
            </RadixSelect.ScrollUpButton>

            <RadixSelect.Viewport className="p-1">
              {options.map((option) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    'relative flex items-center px-8 py-2 text-sm rounded-md',
                    'cursor-default select-none outline-none',
                    'text-foreground',
                    'focus:bg-accent-muted focus:text-accent',
                    'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
                    'transition-colors'
                  )}
                >
                  <RadixSelect.ItemIndicator className="absolute left-2">
                    <Check className="w-4 h-4 text-accent" />
                  </RadixSelect.ItemIndicator>
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>

            <RadixSelect.ScrollDownButton className="flex items-center justify-center h-6 cursor-default text-muted-foreground">
              <ChevronDown className="w-4 h-4" />
            </RadixSelect.ScrollDownButton>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {error && <p className="mt-1 text-xs text-exclude">{error}</p>}
    </div>
  );
}

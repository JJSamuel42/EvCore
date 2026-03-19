'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { PICOType } from '@/types';

type BadgeVariant =
  | 'include'
  | 'exclude'
  | 'neutral'
  | 'P'
  | 'I'
  | 'C'
  | 'O'
  | 'admin'
  | 'researcher'
  | 'viewer'
  | 'pending';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  include: 'bg-include-bg text-include border-include/20',
  exclude: 'bg-exclude-bg text-exclude border-exclude/20',
  neutral: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  P: 'bg-pico-p-bg text-pico-p border-pico-p/20',
  I: 'bg-pico-i-bg text-pico-i border-pico-i/20',
  C: 'bg-pico-c-bg text-pico-c border-pico-c/20',
  O: 'bg-pico-o-bg text-pico-o border-pico-o/20',
  admin: 'bg-accent/10 text-accent border-accent/20',
  researcher: 'bg-pico-i-bg text-pico-i border-pico-i/20',
  viewer: 'bg-muted text-muted-foreground border-border',
};

export function Badge({ variant = 'neutral', children, className, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-mono uppercase tracking-wider border rounded',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

interface PICOBadgeProps {
  type: PICOType;
  className?: string;
}

export function PICOBadge({ type, className }: PICOBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-mono font-bold border',
        variantStyles[type],
        className
      )}
    >
      {type}
    </span>
  );
}

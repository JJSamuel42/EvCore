'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
  withRules?: boolean;
}

export function SectionLabel({ children, className, withRules = true }: SectionLabelProps) {
  if (!withRules) {
    return (
      <span className={cn('text-[11px] font-mono uppercase tracking-widest text-accent', className)}>
        {children}
      </span>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1 h-px bg-border" />
      <span className="text-[11px] font-mono uppercase tracking-widest text-accent whitespace-nowrap flex items-center gap-1">
        <span className="text-accent/50">—</span>
        {children}
        <span className="text-accent/50">—</span>
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  label?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, label, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between', className)}>
      <div>
        {label && (
          <p className="text-[11px] font-mono uppercase tracking-widest text-accent mb-1">{label}</p>
        )}
        <h1 className="text-3xl font-serif font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

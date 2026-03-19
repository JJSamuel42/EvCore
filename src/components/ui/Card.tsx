'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  accentTop?: boolean;
  elevated?: boolean;
  hoverEffect?: boolean;
  featured?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, accentTop, elevated, hoverEffect, featured, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card rounded-lg border border-border relative overflow-hidden',
        elevated && 'shadow-md',
        !elevated && 'shadow-sm',
        hoverEffect && 'transition-all duration-200 hover:shadow-lg hover:border-accent/30 cursor-pointer',
        featured && 'border-accent/40 shadow-accent/10',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {accentTop && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-accent" />
      )}
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-border', className)}>
      {children}
    </div>
  );
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function CardBody({ children, className }: CardBodyProps) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('px-6 py-4 border-t border-border bg-muted/50', className)}>
      {children}
    </div>
  );
}

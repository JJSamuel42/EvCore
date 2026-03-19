'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary: [
    'bg-accent text-white border-transparent',
    'hover:bg-accent/90 active:bg-accent/80',
    'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
    'shadow-sm hover:shadow-accent/20',
    'disabled:bg-accent/40 disabled:shadow-none',
  ].join(' '),
  secondary: [
    'bg-transparent text-foreground border-border',
    'hover:border-accent hover:text-accent hover:bg-accent-muted',
    'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
    'disabled:opacity-40',
  ].join(' '),
  ghost: [
    'bg-transparent text-muted-foreground border-transparent',
    'hover:bg-muted hover:text-foreground',
    'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
    'disabled:opacity-40',
  ].join(' '),
  danger: [
    'bg-exclude text-white border-transparent',
    'hover:bg-exclude/90 active:bg-exclude/80',
    'focus-visible:ring-2 focus-visible:ring-exclude focus-visible:ring-offset-2',
    'shadow-sm',
    'disabled:opacity-40 disabled:shadow-none',
  ].join(' '),
};

const sizeStyles: Record<string, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-sm',
  md: 'h-10 px-4 text-sm gap-2 rounded-md min-h-[44px]',
  lg: 'h-12 px-6 text-base gap-2 rounded-md min-h-[44px]',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, className, children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center',
          'font-sans font-medium',
          'border transition-all duration-150',
          'cursor-pointer select-none touch-manipulation',
          'focus-visible:outline-none',
          'disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

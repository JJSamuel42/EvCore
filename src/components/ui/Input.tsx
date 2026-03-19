'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-10 bg-card border border-border rounded-md',
              'text-sm text-foreground placeholder:text-muted-foreground/60',
              'px-3 py-2',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              error && 'border-exclude focus:ring-exclude',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-exclude">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-card border border-border rounded-md',
            'text-sm text-foreground placeholder:text-muted-foreground/60',
            'px-3 py-2.5',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted',
            'resize-y min-h-[80px]',
            error && 'border-exclude focus:ring-exclude',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-exclude">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

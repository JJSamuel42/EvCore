'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/libraries');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        router.push('/libraries');
      } else {
        setError(result.error || 'Invalid credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex">
      {/* Left Editorial Panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 editorial-bg flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative gold circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-accent/5 translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-96 bg-gradient-to-b from-transparent via-accent/20 to-transparent" />

        {/* Logo area */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white text-sm font-mono font-bold">EH</span>
            </div>
            <span className="font-serif text-3xl text-white tracking-tight">
              <span className="text-accent">EH</span>
              <span className="font-bold">Core</span>
            </span>
          </div>
          <div className="flex items-center gap-3 ml-13 mt-1">
            <div className="h-px w-8 bg-accent/40" />
            <p className="text-[11px] font-mono uppercase tracking-widest text-white/40">
              HEOR Research Platform
            </p>
          </div>
        </div>

        {/* Central quote / hero */}
        <div className="relative z-10 max-w-md">
          <div className="h-px w-12 bg-accent mb-8" />
          <blockquote className="font-serif text-3xl xl:text-4xl text-white leading-snug mb-6">
            "Evidence-driven insights for modern health economics research."
          </blockquote>
          <p className="text-sm text-white/50 leading-relaxed">
            EHCore brings together literature management, systematic search, and patient pathway modelling into a single intelligent platform for HEOR professionals.
          </p>
          <div className="h-px w-12 bg-accent/30 mt-8" />
        </div>

        {/* Feature pills */}
        <div className="relative z-10 flex flex-wrap gap-2">
          {['Evidence Libraries', 'Literature Search', 'PICO Framework', 'Patient Funnels', 'AI-Assisted Review'].map((feat) => (
            <span
              key={feat}
              className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-white/40 border border-white/10 rounded-full"
            >
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <span className="font-serif text-3xl">
              <span className="text-accent">EH</span>
              <span className="font-bold text-foreground">Core</span>
            </span>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-1">
              HEOR Platform
            </p>
          </div>

          <div className="mb-8">
            <h1 className="font-serif text-2xl font-semibold text-foreground mb-1.5">Sign in</h1>
            <p className="text-sm text-muted-foreground">Welcome back to your research workspace.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-exclude-bg border border-exclude/20 rounded-md text-sm text-exclude">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@ehcore.com"
                className={cn(
                  'w-full h-11 bg-card border border-border rounded-md',
                  'text-sm text-foreground placeholder:text-muted-foreground/50',
                  'px-3',
                  'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
                  'transition-colors'
                )}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    'w-full h-11 bg-card border border-border rounded-md',
                    'text-sm text-foreground placeholder:text-muted-foreground/50',
                    'px-3 pr-10',
                    'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
                    'transition-colors'
                  )}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full h-11 rounded-md',
                'bg-accent text-white font-medium text-sm',
                'flex items-center justify-center gap-2',
                'transition-all duration-150',
                'hover:bg-accent/90 active:scale-[0.99]',
                'shadow-sm hover:shadow-accent/20',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2'
              )}
            >
              {isLoading ? (
                <span className="font-mono text-xs animate-pulse">Authenticating…</span>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>


          <p className="mt-6 text-center text-[11px] text-muted-foreground/60">
            EHCore v1.0 · For authorized users only
          </p>
        </div>
      </div>
    </div>
  );
}

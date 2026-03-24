'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  Search,
  TrendingDown,
  BarChart2,
  FileText,
  LogOut,
  ChevronDown,
  ChevronRight,
  Settings,
  Menu,
  X,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useLibraryStore } from '@/store/libraries';
import { getInitials } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Libraries', href: '/libraries', icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Lit Search', href: '/lit-search', icon: <Search className="w-4 h-4" /> },
  { label: 'Patient Funnels', href: '/patient-funnels', icon: <TrendingDown className="w-4 h-4" /> },
  { label: 'Dashboard', href: '/dashboard', icon: <BarChart2 className="w-4 h-4" />, disabled: true, badge: 'Soon' },
  { label: 'Dossier Builder', href: '/dossier', icon: <FileText className="w-4 h-4" /> },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { libraries } = useLibraryStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [librariesExpanded, setLibrariesExpanded] = useState(true);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/libraries') return pathname.startsWith('/libraries');
    if (href === '/lit-search') return pathname.startsWith('/lit-search');
    if (href === '/patient-funnels') return pathname.startsWith('/patient-funnels');
    if (href === '/dossier') return pathname.startsWith('/dossier');
    return pathname === href;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border/60">
        <Link href="/libraries" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
          <div className="w-7 h-7 rounded bg-accent flex items-center justify-center">
            <span className="text-white text-xs font-mono font-bold">EH</span>
          </div>
          <span className="font-serif text-xl tracking-tight">
            <span className="text-accent">EH</span>
            <span className="text-foreground font-bold">Core</span>
          </span>
        </Link>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1 pl-9">
          HEOR Platform
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);

          if (item.href === '/libraries') {
            return (
              <div key={item.href}>
                <div className="flex items-center group">
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 flex-1 px-3 py-2 rounded-md text-sm transition-colors',
                      active
                        ? 'bg-accent-muted text-accent font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <span className={active ? 'text-accent' : ''}>{item.icon}</span>
                    <span>{item.label}</span>
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
                  </Link>
                  <button
                    onClick={() => setLibrariesExpanded(!librariesExpanded)}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {librariesExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {librariesExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
                    {libraries.map((lib) => {
                      const libActive = pathname === `/libraries/${lib.id}`;
                      return (
                        <Link
                          key={lib.id}
                          href={`/libraries/${lib.id}`}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'block px-2 py-1.5 rounded text-xs transition-colors truncate',
                            libActive
                              ? 'text-accent bg-accent-muted font-medium'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                          title={lib.name}
                        >
                          <span className="font-medium">{lib.name}</span>
                          <span className="text-muted-foreground/60 ml-1">({lib.innName})</span>
                        </Link>
                      );
                    })}
                    <Link
                      href="/libraries/new"
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-accent hover:bg-accent-muted transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Library</span>
                    </Link>
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.disabled ? '#' : item.href}
              onClick={() => !item.disabled && setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                item.disabled
                  ? 'text-muted-foreground/40 cursor-not-allowed'
                  : active
                  ? 'bg-accent-muted text-accent font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span className={cn(active && !item.disabled ? 'text-accent' : '')}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[9px] font-mono px-1 py-0.5 bg-muted text-muted-foreground rounded uppercase tracking-wider">
                  {item.badge}
                </span>
              )}
              {active && !item.disabled && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/60 p-3 space-y-1">
        {user?.role === 'admin' && (
          <Link
            href="/admin"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === '/admin'
                ? 'bg-accent-muted text-accent font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Settings className="w-4 h-4" />
            <span>Admin</span>
          </Link>
        )}

        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-mono font-bold text-accent">{getInitials(user?.name || 'U')}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded text-muted-foreground hover:text-exclude hover:bg-exclude-bg transition-colors"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col">
            <div className="absolute top-4 right-4">
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-serif text-lg">
            <span className="text-accent">EH</span>
            <span className="font-bold">Core</span>
          </span>
          <div className="w-9" />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

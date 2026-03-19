'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'researcher' | 'viewer';
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (requiredRole && user) {
      const roleHierarchy = { admin: 3, researcher: 2, viewer: 1 };
      const userLevel = roleHierarchy[user.role] || 0;
      const requiredLevel = roleHierarchy[requiredRole] || 0;

      if (userLevel < requiredLevel) {
        router.replace('/libraries');
      }
    }
  }, [isAuthenticated, user, requiredRole, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm font-mono animate-pulse">Authenticating...</div>
      </div>
    );
  }

  if (requiredRole && user) {
    const roleHierarchy: Record<string, number> = { admin: 3, researcher: 2, viewer: 1 };
    if ((roleHierarchy[user.role] || 0) < (roleHierarchy[requiredRole] || 0)) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground text-sm font-mono">Access denied.</div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

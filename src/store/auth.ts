import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  users: User[];
  // passwords stored separately, keyed by user id
  _passwords: Record<string, string>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'> & { password: string }) => User;
  updateUser: (id: string, updates: Partial<User> & { password?: string }) => void;
  deactivateUser: (id: string) => void;
}

const SEED_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@ehcore.com',
    role: 'admin',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    name: 'Dr. Sarah Chen',
    email: 'researcher1@ehcore.com',
    role: 'researcher',
    active: true,
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'user-3',
    name: 'John Viewer',
    email: 'viewer@ehcore.com',
    role: 'viewer',
    active: true,
    createdAt: '2024-02-01T00:00:00Z',
  },
];

const SEED_PASSWORDS: Record<string, string> = {
  'user-1': 'admin123',
  'user-2': 'research123',
  'user-3': 'view123',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      users: SEED_USERS,
      _passwords: SEED_PASSWORDS,

      login: async (email: string, password: string) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const { users, _passwords } = get();
        const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!found || _passwords[found.id] !== password) {
          return { success: false, error: 'Invalid email or password.' };
        }
        if (!found.active) {
          return { success: false, error: 'This account has been deactivated. Contact an administrator.' };
        }
        set({ user: found, isAuthenticated: true });
        return { success: true };
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      addUser: ({ password, ...userData }) => {
        const newUser: User = {
          ...userData,
          id: `user-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          users: [...state.users, newUser],
          _passwords: { ...state._passwords, [newUser.id]: password },
        }));
        return newUser;
      },

      updateUser: (id, { password, ...updates }) => {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
          user: state.user?.id === id ? { ...state.user, ...updates } : state.user,
          ...(password ? { _passwords: { ...state._passwords, [id]: password } } : {}),
        }));
      },

      deactivateUser: (id: string) => {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, active: false } : u)),
        }));
      },
    }),
    {
      name: 'ehcore-auth',
      // Persist everything including users and passwords
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        users: state.users,
        _passwords: state._passwords,
      }),
      // Merge persisted state with seed data on first load, preserving any additions
      merge: (persisted: any, current) => {
        const p = persisted as Partial<AuthState>;
        // Ensure seed users exist (in case of fresh store or missing seeds)
        const existingIds = new Set((p.users || []).map((u: User) => u.id));
        const missingSeeds = SEED_USERS.filter((u) => !existingIds.has(u.id));
        const missingPasswords = Object.fromEntries(
          Object.entries(SEED_PASSWORDS).filter(([id]) => !p._passwords?.[id])
        );
        return {
          ...current,
          ...p,
          users: [...(p.users || []), ...missingSeeds],
          _passwords: { ...(p._passwords || {}), ...missingPasswords },
        };
      },
    }
  )
);

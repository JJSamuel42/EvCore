import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  users: User[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'> & { password: string }) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deactivateUser: (id: string) => void;
}

interface MockUser extends User {
  password: string;
}

const MOCK_USERS: MockUser[] = [
  {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@ehcore.com',
    role: 'admin',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    password: 'admin123',
  },
  {
    id: 'user-2',
    name: 'Dr. Sarah Chen',
    email: 'researcher1@ehcore.com',
    role: 'researcher',
    active: true,
    createdAt: '2024-01-15T00:00:00Z',
    password: 'research123',
  },
  {
    id: 'user-3',
    name: 'John Viewer',
    email: 'viewer@ehcore.com',
    role: 'viewer',
    active: true,
    createdAt: '2024-02-01T00:00:00Z',
    password: 'view123',
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      users: MOCK_USERS.map(({ password, ...user }) => user),

      login: async (email: string, password: string) => {
        await new Promise((resolve) => setTimeout(resolve, 600));

        const mockUser = MOCK_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if (!mockUser) {
          return { success: false, error: 'Invalid email or password.' };
        }

        if (!mockUser.active) {
          return { success: false, error: 'Your account has been deactivated. Please contact an administrator.' };
        }

        const { password: _, ...user } = mockUser;
        set({ user, isAuthenticated: true });
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
        set((state) => ({ users: [...state.users, newUser] }));
        // In a real app, we'd also store the password hashed
        MOCK_USERS.push({ ...newUser, password });
      },

      updateUser: (id: string, updates: Partial<User>) => {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
          user: state.user?.id === id ? { ...state.user, ...updates } : state.user,
        }));
        const mockIdx = MOCK_USERS.findIndex((u) => u.id === id);
        if (mockIdx >= 0) {
          MOCK_USERS[mockIdx] = { ...MOCK_USERS[mockIdx], ...updates };
        }
      },

      deactivateUser: (id: string) => {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, active: false } : u)),
        }));
      },
    }),
    {
      name: 'ehcore-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

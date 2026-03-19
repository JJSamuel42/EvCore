'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Shield, UserX, UserCheck, Key } from 'lucide-react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/Dialog';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/SectionLabel';
import { useAuthStore } from '@/store/auth';
import { User, UserRole } from '@/types';
import { formatDate, getInitials } from '@/lib/utils';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'researcher', label: 'Researcher' },
  { value: 'viewer', label: 'Viewer' },
];

interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

const DEFAULT_FORM: UserFormData = { name: '', email: '', role: 'researcher', password: '' };

export default function AdminPage() {
  const { users, addUser, updateUser, deactivateUser, user: currentUser } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Partial<UserFormData>>({});

  const openNewUser = () => {
    setEditingUser(null);
    setForm(DEFAULT_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, role: u.role, password: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errs: Partial<UserFormData> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!editingUser && !form.password.trim()) errs.password = 'Password is required for new users';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    if (editingUser) {
      updateUser(editingUser.id, { name: form.name, email: form.email, role: form.role });
    } else {
      addUser({ name: form.name, email: form.email, role: form.role, active: true, password: form.password });
    }
    setIsModalOpen(false);
  };

  return (
    <AuthGuard requiredRole="admin">
      <AppShell>
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          <PageHeader
            label="Administration"
            title="User Management"
            subtitle="Manage platform users, roles, and permissions."
            actions={
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={openNewUser}
              >
                Add User
              </Button>
            }
          />

          <div className="h-px bg-border my-6" />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Users', value: users.length },
              { label: 'Active Users', value: users.filter((u) => u.active).length },
              { label: 'Admins', value: users.filter((u) => u.role === 'admin').length },
            ].map(({ label, value }) => (
              <Card key={label}>
                <div className="px-5 py-4">
                  <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="text-2xl font-serif font-semibold text-foreground mt-1">{value}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Users Table */}
          <Card>
            <div className="overflow-hidden rounded-lg">
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-mono font-bold text-accent">{getInitials(u.name)}</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">{u.name}</p>
                            {u.id === currentUser?.id && (
                              <span className="text-[10px] text-accent font-mono">(you)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-muted-foreground font-mono">{u.email}</span>
                      </td>
                      <td>
                        <Badge variant={u.role as any}>{u.role}</Badge>
                      </td>
                      <td>
                        <Badge variant={u.active ? 'include' : 'exclude'}>
                          {u.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditUser(u)}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit user"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="p-1 text-muted-foreground hover:text-accent transition-colors"
                            title="Reset password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          {u.id !== currentUser?.id && (
                            <button
                              onClick={() => {
                                if (confirm(`${u.active ? 'Deactivate' : 'Activate'} ${u.name}?`)) {
                                  if (u.active) deactivateUser(u.id);
                                  else updateUser(u.id, { active: true } as any);
                                }
                              }}
                              className={`p-1 transition-colors ${u.active ? 'text-muted-foreground hover:text-exclude' : 'text-muted-foreground hover:text-include'}`}
                              title={u.active ? 'Deactivate user' : 'Activate user'}
                            >
                              {u.active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Add/Edit User Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent
            size="sm"
            title={editingUser ? 'Edit User' : 'Add New User'}
          >
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Dr. Jane Smith"
                error={formErrors.name}
              />
              <Input
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="jane@ehcore.com"
                error={formErrors.email}
              />
              <Select
                label="Role"
                value={form.role}
                onValueChange={(v) => setForm((p) => ({ ...p, role: v as UserRole }))}
                options={ROLE_OPTIONS}
              />
              {!editingUser && (
                <Input
                  label="Initial Password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  error={formErrors.password}
                  hint="User should change this on first login."
                />
              )}

              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild>
                  <Button variant="ghost" size="sm">Cancel</Button>
                </DialogClose>
                <Button variant="primary" size="sm" onClick={handleSubmit}>
                  {editingUser ? 'Save Changes' : 'Create User'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AppShell>
    </AuthGuard>
  );
}

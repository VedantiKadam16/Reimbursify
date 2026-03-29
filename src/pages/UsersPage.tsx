import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import type { User, UserRole } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const UsersPage = () => {
  const { users, addUser, company, deleteUser } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'employee' as UserRole, managerId: 'none' });

  const managers = users.filter(u => u.role === 'manager' || u.role === 'admin');

  const handleCreate = () => {
    if (!form.name || !form.email) {
      toast({ title: 'Error', description: 'Name and email required', variant: 'destructive' });
      return;
    }
    const newUser: User = {
      id: crypto.randomUUID(),
      name: form.name,
      email: form.email,
      role: form.role,
      managerId: form.managerId !== 'none' ? form.managerId : undefined,
      companyId: company!.id,
    };
    addUser(newUser);
    setForm({ name: '', email: '', role: 'employee', managerId: 'none' });
    toast({ title: 'User Created', description: `Password sent to ${form.email}` });
  };

  const roleColors: Record<string, string> = {
    admin: 'gradient-primary',
    manager: 'bg-warning',
    employee: 'bg-success',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage company users and roles</p>
        </div>
      </div>

      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">User</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Role</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Manager</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Email</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const mgr = users.find(m => m.id === u.managerId);
                  return (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <span className="text-card-foreground font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-primary-foreground ${roleColors[u.role]}`}>
                          <Shield className="w-3 h-3" /> {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{mgr?.name || '—'}</td>
                      <td className="py-3 px-2 text-muted-foreground">{u.email}</td>
                      <td className="py-3 px-2 text-right">
                        {u.role !== 'admin' && ( // Prevent deleting admin/self
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:bg-destructive/10 h-8 w-8"
                            onClick={() => {
                              if(confirm('Are you sure you want to delete this user?')) deleteUser(u.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                
                {/* Inline New User Row */}
                <tr className="bg-muted/20">
                  <td className="py-4 px-2">
                    <Input 
                      className="w-full h-8 text-sm" 
                      placeholder="New user name" 
                      value={form.name} 
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                    />
                  </td>
                  <td className="py-4 px-2">
                    <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as UserRole }))}>
                      <SelectTrigger className="h-8 text-sm border-primary/20 bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-4 px-2">
                    <Select value={form.managerId} onValueChange={v => setForm(f => ({ ...f, managerId: v }))}>
                      <SelectTrigger className="h-8 text-sm border-primary/20 bg-background"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-4 px-2">
                    <Input 
                      type="email" 
                      className="w-full h-8 text-sm" 
                      placeholder="Email" 
                      value={form.email} 
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                    />
                  </td>
                  <td className="py-4 px-2 text-right">
                    <Button size="sm" variant="outline" className="border-primary/50 text-foreground text-xs h-8" onClick={handleCreate}>
                      Send password
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;

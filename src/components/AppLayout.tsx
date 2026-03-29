import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard, Receipt, CheckSquare, Users, Settings, LogOut, Building2, ShieldCheck,
} from 'lucide-react';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, company, logout, resetData } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager', 'employee'] },
    { to: '/expenses', icon: Receipt, label: 'Expenses', roles: ['admin', 'manager', 'employee'] },
    { to: '/approvals', icon: CheckSquare, label: 'Approvals', roles: ['admin', 'manager'] },
    { to: '/users', icon: Users, label: 'Users', roles: ['admin'] },
    { to: '/approval-rules', icon: ShieldCheck, label: 'Approval Rules', roles: ['admin'] },
  ];

  const filtered = navItems.filter(n => n.roles.includes(currentUser?.role || ''));

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar flex flex-col border-r border-sidebar-border shrink-0">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-heading text-sidebar-primary-foreground">SmartReimburse</h1>
              <p className="text-xs text-sidebar-foreground/60">{company?.name}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {filtered.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                }`
              }
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
              {currentUser?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{currentUser?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{currentUser?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
          <button
            onClick={() => { if(confirm('Are you sure? This will clear all your manual entries and reset to default.')) { resetData(); navigate('/login'); } }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full transition-colors mt-1"
          >
             Reset App Data
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;

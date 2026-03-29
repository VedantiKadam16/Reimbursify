import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = [
  'hsl(210, 100%, 45%)',
  'hsl(152, 60%, 40%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)',
  'hsl(280, 60%, 50%)',
  'hsl(170, 55%, 45%)',
  'hsl(320, 60%, 50%)',
];

const DashboardPage = () => {
  const { expenses, currentUser, users } = useApp();

  const myExpenses = useMemo(() => {
    if (currentUser?.role === 'admin') return expenses;
    if (currentUser?.role === 'manager') {
      const teamIds = users.filter(u => u.managerId === currentUser.id).map(u => u.id);
      return expenses.filter(e => teamIds.includes(e.userId) || e.userId === currentUser.id);
    }
    return expenses.filter(e => e.userId === currentUser?.id);
  }, [expenses, currentUser, users]);

  const stats = useMemo(() => {
    const total = myExpenses.reduce((s, e) => s + (e.convertedAmount || e.amount), 0);
    const pending = myExpenses.filter(e => e.status === 'pending').length;
    const approved = myExpenses.filter(e => e.status === 'approved').length;
    const rejected = myExpenses.filter(e => e.status === 'rejected').length;
    const suspicious = myExpenses.filter(e => e.fraudFlag === 'suspicious').length;
    return { total, pending, approved, rejected, suspicious };
  }, [myExpenses]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    myExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + (e.convertedAmount || e.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [myExpenses]);

  const statCards = [
    { label: 'Total Expenses', value: `₹${stats.total.toLocaleString()}`, icon: TrendingUp, color: 'gradient-primary' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-warning' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'bg-success' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'bg-destructive' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back, {currentUser?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <Card key={s.label} className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold font-heading text-card-foreground mt-1">{s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                  <s.icon className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.suspicious > 0 && (
        <Card className="mb-8 border-warning/30 bg-warning/5">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <p className="text-sm text-warning font-medium">
              {stats.suspicious} expense(s) flagged as suspicious by fraud detection
            </p>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-heading">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-heading">Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Pending', value: stats.pending },
                    { name: 'Approved', value: stats.approved },
                    { name: 'Rejected', value: stats.rejected },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  <Cell fill="hsl(38, 92%, 50%)" />
                  <Cell fill="hsl(152, 60%, 40%)" />
                  <Cell fill="hsl(0, 72%, 51%)" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent */}
      <Card className="mt-6 border-border">
        <CardHeader>
          <CardTitle className="text-base font-heading">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Description</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Category</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Flag</th>
                </tr>
              </thead>
              <tbody>
                {myExpenses.slice(0, 5).map(e => (
                  <tr key={e.id} className="border-b border-border/50">
                    <td className="py-3 px-2 text-card-foreground">{e.description}</td>
                    <td className="py-3 px-2 text-muted-foreground">{e.category}</td>
                    <td className="py-3 px-2 text-card-foreground font-medium">
                      {e.currency} {e.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`status-badge status-${e.status}`}>{e.status}</span>
                    </td>
                    <td className="py-3 px-2">
                      {e.fraudFlag === 'suspicious' && (
                        <span className="status-badge status-suspicious">⚠️ Suspicious</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;

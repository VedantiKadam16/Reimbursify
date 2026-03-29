import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ApprovalsPage = () => {
  const { expenses, currentUser, users, updateExpense, approvalRules } = useApp();
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const pendingApprovals = useMemo(() => {
    return expenses.filter(e =>
      e.status === 'pending' &&
      e.approvalHistory.some(a => a.approverId === currentUser?.id && a.status === 'pending')
    );
  }, [expenses, currentUser]);

  const handleAction = (expenseId: string, action: 'approved' | 'rejected') => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;

    let newHistory = expense.approvalHistory.map(a =>
      a.approverId === currentUser?.id && a.status === 'pending'
        ? { ...a, status: action, comment, timestamp: new Date().toISOString() }
        : a
    );

    let finalStatus: import('@/types').ExpenseStatus = 'pending';

    if (action === 'rejected') {
      finalStatus = 'rejected';
    } else {
      const rule = approvalRules.find(r => r.userId === expense.userId);

      if (!rule) {
        const stillPending = newHistory.some(a => a.status === 'pending' || a.status === 'waiting');
        finalStatus = stillPending ? 'pending' : 'approved';
      } else {
        const isAutoApprover = rule.approvers.find(a => a.userId === currentUser?.id)?.autoApprove;
        if (isAutoApprover) {
          finalStatus = 'approved';
        } else {
          const totalApprovers = newHistory.length;
          const approvedCount = newHistory.filter(a => a.status === 'approved').length;
          const percentage = (approvedCount / totalApprovers) * 100;

          if (percentage >= rule.minApprovalPercentage) {
            finalStatus = 'approved';
          } else {
            if (rule.useSequence) {
              const nextIdx = newHistory.findIndex(a => a.status === 'waiting');
              if (nextIdx !== -1) {
                newHistory[nextIdx].status = 'pending';
              }
            }
            const stillCanApprove = newHistory.some(a => a.status === 'pending' || a.status === 'waiting');
            if (!stillCanApprove) {
              finalStatus = 'rejected';
            }
          }
        }
      }
    }

    const updated = {
      ...expense,
      approvalHistory: newHistory,
      status: finalStatus,
    };
    updateExpense(updated);
    setSelectedExpense(null);
    setComment('');
    toast({ title: action === 'approved' ? 'Expense Approved' : 'Expense Rejected' });
  };

  const selected = expenses.find(e => e.id === selectedExpense);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-foreground">Approvals</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and manage expense approvals</p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-heading">Pending Approvals ({pendingApprovals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Subject</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Request Owner</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Category</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Amount ({'\u20B9'})</th>
                  <th className="text-center py-3 px-2 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.map(e => {
                  const owner = users.find(u => u.id === e.userId);
                  return (
                    <tr key={e.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2 text-card-foreground">
                        <div className="flex items-center gap-2">
                          {e.description}
                          {e.fraudFlag === 'suspicious' && <AlertTriangle className="w-4 h-4 text-warning" />}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{owner?.name}</td>
                      <td className="py-3 px-2 text-muted-foreground">{e.category}</td>
                      <td className="py-3 px-2"><span className="status-badge status-pending">Pending</span></td>
                      <td className="py-3 px-2 text-right text-card-foreground font-medium">
                        <span className="text-xs text-muted-foreground">{e.currency} {e.amount}</span>
                        {' = '}₹{(e.convertedAmount || e.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => setSelectedExpense(e.id)}>
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setSelectedExpense(e.id)}>
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {pendingApprovals.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No pending approvals</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={!!selectedExpense} onOpenChange={() => { setSelectedExpense(null); setComment(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Review Expense</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Description:</span><p className="font-medium text-card-foreground">{selected.description}</p></div>
                <div><span className="text-muted-foreground">Amount:</span><p className="font-medium text-card-foreground">{selected.currency} {selected.amount.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">Category:</span><p className="text-card-foreground">{selected.category}</p></div>
                <div><span className="text-muted-foreground">Date:</span><p className="text-card-foreground">{selected.date}</p></div>
              </div>
              {selected.fraudFlag === 'suspicious' && (
                <div className="p-3 rounded-lg bg-warning/10 text-warning text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> This expense has been flagged as suspicious
                </div>
              )}
              {selected.approvalHistory.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-card-foreground mb-2">Approval History</p>
                  {selected.approvalHistory.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm py-1">
                      <span className={`status-badge status-${a.status}`}>{a.status}</span>
                      <span className="text-card-foreground">{a.approverName}</span>
                      {a.timestamp && <span className="text-muted-foreground text-xs">{new Date(a.timestamp).toLocaleString()}</span>}
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">Comment</label>
                <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add your comments..." />
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 bg-success text-success-foreground hover:bg-success/90" onClick={() => handleAction(selected.id, 'approved')}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve
                </Button>
                <Button className="flex-1" variant="destructive" onClick={() => handleAction(selected.id, 'rejected')}>
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalsPage;

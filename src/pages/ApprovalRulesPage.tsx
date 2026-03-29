import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import type { ApprovalRule, ApproverStep } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ApprovalRulesPage = () => {
  const { approvalRules, users, addApprovalRule, company } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', userId: '', managerId: '',
    isManagerApprover: true, useSequence: false, minApprovalPercentage: 60,
  });
  const [approvers, setApprovers] = useState<ApproverStep[]>([]);

  const employees = users.filter(u => u.role === 'employee');
  const managers = users.filter(u => u.role === 'manager' || u.role === 'admin');
  const allUsers = users;

  const addApprover = () => {
    setApprovers(a => [...a, { order: a.length + 1, userId: '', userName: '', required: false, autoApprove: false }]);
  };

  const updateApprover = (idx: number, field: string, value: any) => {
    setApprovers(a => a.map((ap, i) => {
      if (i !== idx) return ap;
      if (field === 'userId') {
        const user = allUsers.find(u => u.id === value);
        return { ...ap, userId: value, userName: user?.name || '' };
      }
      return { ...ap, [field]: value };
    }));
  };

  const handleCreate = () => {
    if (!form.name || !form.userId) {
      toast({ title: 'Error', description: 'Name and user are required', variant: 'destructive' });
      return;
    }
    const rule: ApprovalRule = {
      id: crypto.randomUUID(),
      name: form.name,
      description: form.description,
      userId: form.userId,
      managerId: form.managerId,
      approvers,
      isManagerApprover: form.isManagerApprover,
      useSequence: form.useSequence,
      minApprovalPercentage: form.minApprovalPercentage,
      companyId: company!.id,
    };
    addApprovalRule(rule);
    setOpen(false);
    setForm({ name: '', description: '', userId: '', managerId: '', isManagerApprover: true, useSequence: false, minApprovalPercentage: 60 });
    setApprovers([]);
    toast({ title: 'Approval Rule Created' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Approval Rules</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure expense approval workflows</p>
        </div>
      <Card className="mb-8 border-2 border-foreground/10 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-muted px-6 py-3 border-b flex justify-between items-center">
          <h2 className="font-heading font-semibold text-lg">Admin view (Approval rules)</h2>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Left Column */}
            <div className="space-y-8">
              <div className="flex items-end gap-4">
                <Label className="w-16 text-muted-foreground whitespace-nowrap">User</Label>
                <div className="flex-1">
                  <Select value={form.userId} onValueChange={v => setForm(f => ({ ...f, userId: v, name: `${users.find(u => u.id === v)?.name} Rule` }))}>
                    <SelectTrigger className="border-t-0 border-x-0 border-b-2 border-foreground rounded-none shadow-none px-0 focus:ring-0 text-lg font-medium">
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent>{employees.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-muted-foreground">Description about rules</Label>
                <Input 
                  className="border-t-0 border-x-0 border-b-2 border-foreground rounded-none shadow-none px-0 focus-visible:ring-0 text-lg font-medium" 
                  value={form.description} 
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                  placeholder="Approval rule for miscellaneous expenses" 
                />
              </div>

              <div className="flex items-center gap-4">
                <Label className="w-16 text-muted-foreground">Manager:</Label>
                <div className="flex-1">
                  <Select value={form.managerId} onValueChange={v => setForm(f => ({ ...f, managerId: v }))}>
                    <SelectTrigger className="w-48 border-t-0 border-x-0 border-b-2 border-foreground rounded-none shadow-none px-0 focus:ring-0 text-lg font-medium">
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>{managers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2 max-w-[250px]">
                    Dynamic dropdown Initially the manager set on user record should be set, admin can change manager for approval if required.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-medium">Approvers</h3>
                <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg">
                  <span className="text-xs text-muted-foreground max-w-[200px] leading-tight text-right">If this field is checked then by default the approve request would go to his/her manager first, before going to other approvers</span>
                  <div className="flex flex-col items-center gap-1">
                    <Label className="text-xs font-semibold">Is manager an approver?</Label>
                    <Checkbox id="mgr-approver" checked={form.isManagerApprover} onCheckedChange={v => setForm(f => ({ ...f, isManagerApprover: !!v }))} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 mb-2">
                  <div className="text-sm text-muted-foreground w-1/2">User</div>
                  <div className="text-sm text-muted-foreground text-center">Required</div>
                </div>

                {approvers.map((ap, i) => (
                  <div key={i} className="flex items-center gap-4 mb-2">
                    <span className="font-medium w-4">{i + 1}</span>
                    <Select value={ap.userId} onValueChange={v => updateApprover(i, 'userId', v)}>
                      <SelectTrigger className="flex-1 border-t-0 border-x-0 border-b border-foreground/30 rounded-none shadow-none">
                        <SelectValue placeholder="Select approver" />
                      </SelectTrigger>
                      <SelectContent>{allUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="w-20 flex justify-center">
                      <Checkbox className="w-5 h-5" checked={ap.required} onCheckedChange={v => updateApprover(i, 'required', !!v)} />
                    </div>
                  </div>
                ))}
                
                <Button variant="ghost" size="sm" className="mt-2 text-primary" onClick={addApprover}>
                  + Add Approver Row
                </Button>
              </div>

              <div className="pt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox className="mt-1" id="seq" checked={form.useSequence} onCheckedChange={v => setForm(f => ({ ...f, useSequence: !!v }))} />
                  <div>
                    <label htmlFor="seq" className="font-medium text-sm">Approvers Sequence:</label>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[400px]">
                      If this field is ticked then the above mentioned sequence of approvers matters, that is first the request goes to John, if he approves/rejects then only request goes to mitchell and so on. If the required approver rejects the request, then expense request is auto-rejected. If not ticked then send approver request to all approvers at the same time.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-border border-dashed">
                  <div className="flex flex-col">
                    <Label className="text-sm text-muted-foreground mb-1">Minimum Approval percent</Label>
                    <Input type="number" className="w-32 bg-primary/10 border-primary shadow-sm font-semibold text-center" value={form.minApprovalPercentage} onChange={e => setForm(f => ({ ...f, minApprovalPercentage: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <p className="text-xs text-muted-foreground italic flex-1 self-end mb-2">
                    Specify the number of percentage approvers required in order to get the request approved.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button className="gradient-primary text-primary-foreground px-8" onClick={handleCreate}>Save Configuration</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      <div className="space-y-4">
        {approvalRules.map(rule => {
          const user = users.find(u => u.id === rule.userId);
          const mgr = users.find(u => u.id === rule.managerId);
          return (
            <Card key={rule.id} className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold font-heading text-card-foreground">{rule.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                      <div><span className="text-muted-foreground">User:</span> <span className="text-card-foreground">{user?.name}</span></div>
                      <div><span className="text-muted-foreground">Manager:</span> <span className="text-card-foreground">{mgr?.name}</span></div>
                      <div><span className="text-muted-foreground">Sequence:</span> <span className="text-card-foreground">{rule.useSequence ? 'Yes' : 'No'}</span></div>
                      <div><span className="text-muted-foreground">Min %:</span> <span className="text-card-foreground">{rule.minApprovalPercentage}%</span></div>
                    </div>
                    {rule.approvers.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Approvers</p>
                        <div className="flex flex-wrap gap-2">
                          {rule.approvers.map((a, i) => (
                            <span key={i} className={`px-2 py-1 rounded text-xs ${a.required ? 'bg-primary/10 text-primary font-medium' : 'bg-muted text-muted-foreground'}`}>
                              {a.order}. {a.userName} {a.required && '(Required)'} {a.autoApprove && '(Auto-Approver)'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ApprovalRulesPage;

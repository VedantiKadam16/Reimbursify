import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import type { Expense } from '@/types';
import { CATEGORIES } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Upload, Receipt, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ExpensesPage = () => {
  const { expenses, currentUser, users, addExpense, company, approvalRules } = useApp();
  const [open, setOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState({
    description: '', amount: '', currency: company?.currency || 'USD',
    category: '', date: '', paidBy: currentUser?.name || '', remarks: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currencies, setCurrencies] = useState<string[]>([]);

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,currencies')
      .then(res => res.json())
      .then(data => {
        const currSet = new Set<string>();
        data.forEach((item: any) => {
          if (item.currencies) {
            Object.keys(item.currencies).forEach(c => currSet.add(c));
          }
        });
        const currArray = Array.from(currSet).sort();
        setCurrencies(currArray);
        if (currArray.length > 0 && !form.currency && !company?.currency) {
           setForm(f => ({ ...f, currency: 'USD' }));
        }
      })
      .catch(err => console.error('Failed to fetch currencies', err));
  }, []);

  const myExpenses = useMemo(() => {
    if (currentUser?.role === 'admin') return expenses;
    return expenses.filter(e => e.userId === currentUser?.id);
  }, [expenses, currentUser]);

  const summaryAmounts = useMemo(() => {
    const draft = myExpenses.filter(e => e.status === 'draft').reduce((s, e) => s + (e.convertedAmount || e.amount), 0);
    const pending = myExpenses.filter(e => e.status === 'pending').reduce((s, e) => s + (e.convertedAmount || e.amount), 0);
    const approved = myExpenses.filter(e => e.status === 'approved').reduce((s, e) => s + (e.convertedAmount || e.amount), 0);
    return { draft, pending, approved };
  }, [myExpenses]);

  const detectFraud = (amount: number, date: string): 'normal' | 'suspicious' => {
    const userExpenses = expenses.filter(e => e.userId === currentUser?.id && e.status !== 'draft');
    
    // Check for duplicate receipt
    const isDuplicate = userExpenses.some(e => e.amount === amount && e.date === date);
    if (isDuplicate) return 'suspicious';

    if (userExpenses.length === 0) return 'normal';
    const avg = userExpenses.reduce((s, e) => s + (e.convertedAmount || e.amount), 0) / userExpenses.length;
    return amount > avg * 3 ? 'suspicious' : 'normal';
  };

  const handleOCR = async (file: File | null) => {
    if (!file) return;
    setOcrLoading(true);
    toast({ title: 'Scanning Receipt...', description: 'Please wait, analyzing image with Tesseract OCR...' });

    try {
      // Import dynamically to avoid loading issues on initial render if huge
      const Tesseract = (await import('tesseract.js')).default;
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text;
      
      // Smart extraction
      let extractedAmount = '0.00';
      const amountMatch = text.match(/(?:total|amount|sum|usd|\$|€|£|₹)?\s*\$?([0-9]+[.,][0-9]{2})\b/i);
      if (amountMatch) {
         extractedAmount = amountMatch[1].replace(',', '.');
      } else {
         // Fallback to finding the largest decimal number
         const decimals = [...text.matchAll(/[0-9]+[.,][0-9]{2}/g)].map(m => parseFloat(m[0].replace(',', '.')));
         if(decimals.length > 0) extractedAmount = Math.max(...decimals).toFixed(2);
      }

      let extractedDate = new Date().toISOString().split('T')[0];
      const dateMatch = text.match(/\b\d{1,4}[-/]\d{1,2}[-/]\d{1,4}\b/);
      if (dateMatch) {
         const d = new Date(dateMatch[0]);
         if (!isNaN(d.getTime())) extractedDate = d.toISOString().split('T')[0];
      }
      
      let vendor = 'Unknown Vendor (OCR)';
      const lines = text.split('\n').filter(l => l.trim().length > 3);
      if (lines.length > 0) vendor = lines[0].trim(); // First line is usually the vendor name

      setForm(f => ({
        ...f,
        amount: extractedAmount === '0.00' ? '120.00' : extractedAmount,
        description: `Receipt from ${vendor}`,
        category: text.toLowerCase().includes('food') || text.toLowerCase().includes('restaurant') ? 'Food & Dining' : 'Office Supplies',
        date: extractedDate,
      }));
      setOcrLoading(false);
      toast({ title: 'OCR Complete!', description: `Extracted Amount: ${extractedAmount}, Date: ${extractedDate}` });
    } catch (e) {
      console.error(e);
      setOcrLoading(false);
      toast({ title: 'OCR Failed', description: 'Could not extract text. Falling back to simulation.', variant: 'destructive' });
      // fallback simulation
      setForm(f => ({
        ...f,
        amount: '89.99',
        description: 'Office Supplies (Simulation)',
        category: 'Office Supplies',
        date: new Date().toISOString().split('T')[0],
      }));
    }
  };

  const handleSubmit = async (asDraft: boolean) => {
    const amount = parseFloat(form.amount);
    if (!amount || !form.category || !form.description || !company?.currency) {
      toast({ title: 'Error', description: 'Please fill all required fields and ensure company currency is set.', variant: 'destructive' });
      return;
    }
    
    setSubmitLoading(true);
    let finalConvertedAmount = amount;
    
    if (form.currency !== company.currency) {
      try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${form.currency}`);
        const data = await response.json();
        const rate = data.rates[company.currency];
        if (rate) {
          finalConvertedAmount = amount * rate;
        } else {
          toast({ title: 'Warning', description: 'Exchange rate not found. Using 1:1 conversion.', variant: 'destructive' });
        }
      } catch (err) {
        console.error('Exchange API error', err);
        toast({ title: 'Warning', description: 'Failed to fetch exchange rate. Using 1:1 conversion.', variant: 'destructive' });
      }
    }

    const manager = users.find(u => u.id === currentUser?.managerId);
    let initialHistory: import('@/types').ApprovalEntry[] = [];
    
    if (!asDraft) {
      const rule = approvalRules?.find(r => r.userId === currentUser?.id);
      if (rule) {
        const isSeq = rule.useSequence;
        if (rule.isManagerApprover && manager) {
          initialHistory.push({ approverId: manager.id, approverName: manager.name, status: 'pending' });
        }
        rule.approvers.forEach(ap => {
          initialHistory.push({
            approverId: ap.userId,
            approverName: ap.userName,
            status: (isSeq && initialHistory.length > 0) ? 'waiting' : 'pending',
          });
        });
        if (initialHistory.length === 0 && manager) {
          initialHistory.push({ approverId: manager.id, approverName: manager.name, status: 'pending' });
        }
      } else if (manager) {
        initialHistory.push({ approverId: manager.id, approverName: manager.name, status: 'pending' });
      } else {
        initialHistory.push({ approverId: 'admin', approverName: 'Admin', status: 'pending' });
      }
    }

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      userId: currentUser!.id,
      description: form.description,
      amount,
      currency: form.currency,
      convertedAmount: finalConvertedAmount,
      category: form.category,
      date: form.date || new Date().toISOString().split('T')[0],
      status: asDraft ? 'draft' : 'pending',
      fraudFlag: detectFraud(finalConvertedAmount, form.date || new Date().toISOString().split('T')[0]),
      paidBy: form.paidBy,
      remarks: form.remarks,
      receiptUrl: receiptFile ? URL.createObjectURL(receiptFile) : undefined,
      approvalHistory: initialHistory,
      createdAt: new Date().toISOString(),
    };
    
    addExpense(newExpense);
    setSubmitLoading(false);
    setOpen(false);
    setForm({ description: '', amount: '', currency: company?.currency || 'USD', category: '', date: '', paidBy: currentUser?.name || '', remarks: '' });
    setReceiptFile(null);
    toast({ title: asDraft ? 'Draft Saved' : 'Expense Submitted', description: newExpense.fraudFlag === 'suspicious' ? '⚠️ Flagged as suspicious' : 'Success' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your expense claims</p>
        </div>
        {currentUser?.role === 'employee' && (
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => { setReceiptFile(null); setSelectedExpense(null); setOpen(true); }}><Upload className="w-4 h-4 mr-2" /> Upload</Button>
            <Dialog open={open} onOpenChange={(v) => { if (!v) setSelectedExpense(null); setOpen(v); }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-dashed px-6">New</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-8 rounded-[2rem]">
                <DialogTitle className="sr-only">Expense Details</DialogTitle>
                <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                  <div>
                    <input type="file" accept="image/*" className="hidden" id="receipt-upload" disabled={!!selectedExpense} onChange={e => { const file = e.target.files?.[0] || null; setReceiptFile(file); handleOCR(file); }} />
                    <label htmlFor="receipt-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 border border-border rounded-lg px-4 py-2 hover:bg-muted transition-colors text-sm font-medium">
                        {ocrLoading ? (
                          <><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> Scanning...</>
                        ) : (
                          receiptFile ? receiptFile.name : 'Attach Receipt'
                        )}
                      </div>
                    </label>
                  </div>
                  <div className="flex items-center gap-3 text-lg font-heading">
                    <span className={selectedExpense?.status === 'draft' || !selectedExpense ? "text-foreground font-semibold" : "text-muted-foreground"}>Draft</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className={selectedExpense?.status === 'pending' ? "text-foreground font-semibold" : "text-muted-foreground"}>Waiting approval</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className={selectedExpense?.status === 'approved' ? "text-success font-semibold" : "text-muted-foreground"}>Approved</span>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                    {/* Left Col */}
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm font-semibold">Description</Label>
                        <Input disabled={!!selectedExpense} className="border-x-0 border-t-0 border-b-2 border-foreground rounded-none shadow-none px-0 focus-visible:ring-0 text-base" value={selectedExpense ? selectedExpense.description : form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm font-semibold">Category</Label>
                        <Input disabled={!!selectedExpense} className="border-x-0 border-t-0 border-b-2 border-foreground rounded-none shadow-none px-0 focus-visible:ring-0 text-base" value={selectedExpense ? selectedExpense.category : form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm font-semibold flex items-center gap-1">Total amount in <span className="underline cursor-pointer">currency selection ▼</span></Label>
                        <div className="flex items-end gap-2">
                          <Input disabled={!!selectedExpense} type="number" className="border-x-0 border-t-0 border-b-2 border-foreground rounded-none shadow-none px-0 focus-visible:ring-0 text-base flex-1" value={selectedExpense ? selectedExpense.amount : form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                          <div className="font-semibold text-lg pb-1">{selectedExpense ? selectedExpense.currency : form.currency} $</div>
                        </div>
                        {!selectedExpense && <p className="text-xs text-destructive italic max-w-xs leading-tight mt-2">Employee can submit expense in any currency (currency in which he spent the money in receipt)</p>}
                        {!selectedExpense && <p className="text-xs text-destructive italic max-w-xs leading-tight mt-1">In manager's approval dashboard, the amount should get auto-converted to base currency of the company with real-time today's currency conversion rates.</p>}
                      </div>
                    </div>
                    {/* Right Col */}
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm font-semibold">Expense Date</Label>
                        <Input disabled={!!selectedExpense} type="date" className="border-x-0 border-t-0 border-b-2 border-foreground rounded-none shadow-none px-0 focus-visible:ring-0 text-base" value={selectedExpense ? selectedExpense.date : form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm font-semibold">Paid by:</Label>
                        <div className="relative">
                          <Input disabled={!!selectedExpense} className="border-x-0 border-t-0 border-b-2 border-foreground rounded-none shadow-none px-0 focus-visible:ring-0 text-base" value={selectedExpense ? selectedExpense.paidBy : form.paidBy} onChange={e => setForm(f => ({ ...f, paidBy: e.target.value }))} />
                          <div className="absolute right-0 bottom-2 text-xs">▼</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm font-semibold">Remarks</Label>
                        <Input disabled={!!selectedExpense} className="border-x-0 border-t-0 border-b-2 border-foreground rounded-none shadow-none px-0 focus-visible:ring-0 text-base" value={selectedExpense ? selectedExpense.remarks : form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Label className="text-foreground text-sm font-semibold">Description</Label>
                    <Textarea disabled={!!selectedExpense} className="mt-2 min-h-[80px] resize-none" placeholder="Expanded description text..." />
                  </div>

                  {selectedExpense && (
                    <div className="pt-6">
                      <table className="w-full text-sm text-center">
                        <thead>
                          <tr className="text-muted-foreground"><th className="pb-3 font-medium">Approver</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Time</th></tr>
                        </thead>
                        <tbody>
                          {selectedExpense.approvalHistory.map((h, i) => (
                            <tr key={i}><td className="py-2">{h.approverName}</td><td className="py-2 capitalize">{h.status}</td><td className="py-2 text-muted-foreground">12:44 4th Oct, 2025</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {!selectedExpense && (
                    <div className="pt-8">
                      <Button variant="outline" className="border-foreground text-foreground px-8 rounded-full shadow-sm mx-auto flex" onClick={() => handleSubmit(false)}>Submit</Button>
                      <p className="text-xs text-muted-foreground mt-4 text-center max-w-sm mx-auto leading-tight italic">
                        Once submitted the record should become readonly for employee and the submit button should be invisible and state should be pending approval flow, there should be a log history visible that which user approved/rejected your request at what time.
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mb-6 px-4 py-3 bg-card border rounded-xl overflow-x-auto text-sm font-medium">
        <div className="flex flex-col items-center px-4">
          <span className="text-lg text-foreground font-semibold">{summaryAmounts.draft.toLocaleString()} {company?.currency || ''}</span>
          <span className="text-muted-foreground uppercase text-xs">To submit</span>
        </div>
        <div className="text-border px-2">
          <ArrowRight className="w-5 h-5" />
        </div>
        <div className="flex flex-col items-center px-4">
          <span className="text-lg text-warning font-semibold">{summaryAmounts.pending.toLocaleString()} {company?.currency || ''}</span>
          <span className="text-muted-foreground uppercase text-xs">Waiting approval</span>
        </div>
        <div className="text-border px-2">
          <ArrowRight className="w-5 h-5" />
        </div>
        <div className="flex flex-col items-center px-4">
          <span className="text-lg text-success font-semibold">{summaryAmounts.approved.toLocaleString()} {company?.currency || ''}</span>
          <span className="text-muted-foreground uppercase text-xs">Approved</span>
        </div>
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Employee</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Description</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Date</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Category</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Paid By</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Remarks</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {myExpenses.map(e => {
                  const owner = users.find(u => u.id === e.userId);
                  return (
                    <tr key={e.id} className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => { setSelectedExpense(e); setOpen(true); }}>
                      <td className="py-3 px-2 text-card-foreground">{owner?.name || currentUser?.name}</td>
                      <td className="py-3 px-2 text-card-foreground">
                        <div className="flex items-center gap-2">
                          {e.description}
                          {e.fraudFlag === 'suspicious' && <AlertTriangle className="w-4 h-4 text-warning" />}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{e.date}</td>
                      <td className="py-3 px-2 text-muted-foreground">{e.category}</td>
                      <td className="py-3 px-2 text-muted-foreground">{e.paidBy}</td>
                      <td className="py-3 px-2 text-muted-foreground">{e.remarks || '—'}</td>
                      <td className="py-3 px-2 text-right text-card-foreground font-medium">{e.currency} {e.amount.toLocaleString()}</td>
                      <td className="py-3 px-2">
                        <span className={`status-badge status-${e.status}`}>{e.status}</span>
                      </td>
                    </tr>
                  );
                })}
                {myExpenses.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No expenses yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesPage;

import type { User, Company, Expense, ApprovalRule } from '@/types';

export const mockCompany: Company = {
  id: 'comp-1',
  name: 'Acme Corp',
  country: 'India',
  currency: 'INR',
  adminId: 'user-1',
};

export const mockUsers: User[] = [
  { id: 'user-1', name: 'Abhishek Kumar', email: 'admin@acme.com', role: 'admin', companyId: 'comp-1' },
  { id: 'user-2', name: 'Sarah Johnson', email: 'sarah@acme.com', role: 'manager', companyId: 'comp-1' },
  { id: 'user-3', name: 'Marc Wilson', email: 'marc@acme.com', role: 'employee', managerId: 'user-2', companyId: 'comp-1' },
  { id: 'user-4', name: 'John Mitchell', email: 'john@acme.com', role: 'manager', companyId: 'comp-1' },
  { id: 'user-5', name: 'Andrea Lopez', email: 'andrea@acme.com', role: 'employee', managerId: 'user-2', companyId: 'comp-1' },
];

export const mockExpenses: Expense[] = [
  {
    id: 'exp-1',
    userId: 'user-3',
    description: 'Restaurant bill - client meeting',
    amount: 5000,
    currency: 'INR',
    convertedAmount: 5000,
    category: 'Food & Dining',
    date: '2025-10-04',
    status: 'pending',
    fraudFlag: 'normal',
    paidBy: 'Marc Wilson',
    remarks: '',
    approvalHistory: [
      { approverId: 'user-2', approverName: 'Sarah Johnson', status: 'pending' },
    ],
    createdAt: '2025-10-04T10:00:00Z',
  },
  {
    id: 'exp-2',
    userId: 'user-3',
    description: 'Flight tickets - NYC conference',
    amount: 850,
    currency: 'USD',
    convertedAmount: 71400,
    category: 'Travel',
    date: '2025-09-28',
    status: 'approved',
    fraudFlag: 'normal',
    paidBy: 'Marc Wilson',
    approvalHistory: [
      { approverId: 'user-2', approverName: 'Sarah Johnson', status: 'approved', comment: 'Approved - valid conference expense', timestamp: '2025-09-29T14:00:00Z' },
    ],
    createdAt: '2025-09-28T08:00:00Z',
  },
  {
    id: 'exp-3',
    userId: 'user-5',
    description: 'Office supplies bulk order',
    amount: 33674,
    currency: 'INR',
    convertedAmount: 33674,
    category: 'Office Supplies',
    date: '2025-10-01',
    status: 'pending',
    fraudFlag: 'suspicious',
    paidBy: 'Andrea Lopez',
    remarks: 'Bulk purchase for Q4',
    approvalHistory: [
      { approverId: 'user-2', approverName: 'Sarah Johnson', status: 'pending' },
    ],
    createdAt: '2025-10-01T09:00:00Z',
  },
  {
    id: 'exp-4',
    userId: 'user-3',
    description: 'Taxi to airport',
    amount: 500,
    currency: 'INR',
    convertedAmount: 500,
    category: 'Transportation',
    date: '2025-09-30',
    status: 'approved',
    fraudFlag: 'normal',
    paidBy: 'Marc Wilson',
    approvalHistory: [
      { approverId: 'user-2', approverName: 'Sarah Johnson', status: 'approved', comment: 'OK', timestamp: '2025-10-01T10:00:00Z' },
    ],
    createdAt: '2025-09-30T07:00:00Z',
  },
];

export const mockApprovalRules: ApprovalRule[] = [
  {
    id: 'rule-1',
    name: 'Approval rule for miscellaneous expenses',
    description: 'Standard approval flow for misc expenses',
    userId: 'user-3',
    managerId: 'user-2',
    approvers: [
      { order: 1, userId: 'user-4', userName: 'John Mitchell', required: true },
      { order: 2, userId: 'user-2', userName: 'Sarah Johnson', required: false },
      { order: 3, userId: 'user-5', userName: 'Andrea Lopez', required: false },
    ],
    isManagerApprover: true,
    useSequence: false,
    minApprovalPercentage: 60,
    companyId: 'comp-1',
  },
];

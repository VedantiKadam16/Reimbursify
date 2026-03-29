export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  managerId?: string;
  companyId: string;
  avatar?: string;
}

export interface Company {
  id: string;
  name: string;
  country: string;
  currency: string;
  adminId: string;
}

export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type FraudFlag = 'normal' | 'suspicious';

export interface Expense {
  id: string;
  userId: string;
  description: string;
  amount: number;
  currency: string;
  convertedAmount?: number;
  category: string;
  date: string;
  receiptUrl?: string;
  status: ExpenseStatus;
  fraudFlag: FraudFlag;
  paidBy: string;
  remarks?: string;
  approvalHistory: ApprovalEntry[];
  createdAt: string;
}

export interface ApprovalEntry {
  approverId: string;
  approverName: string;
  status: 'approved' | 'rejected' | 'pending' | 'waiting';
  comment?: string;
  timestamp?: string;
}

export interface ApprovalRule {
  id: string;
  name: string;
  description: string;
  userId: string;
  managerId: string;
  approvers: ApproverStep[];
  isManagerApprover: boolean;
  useSequence: boolean;
  minApprovalPercentage: number;
  companyId: string;
}

export interface ApproverStep {
  order: number;
  userId: string;
  userName: string;
  required: boolean;
  autoApprove?: boolean;
}

export const CATEGORIES = [
  'Food & Dining',
  'Travel',
  'Accommodation',
  'Office Supplies',
  'Transportation',
  'Communication',
  'Miscellaneous',
];

export const COUNTRIES_CURRENCIES: Record<string, string> = {
  'United States': 'USD',
  'India': 'INR',
  'United Kingdom': 'GBP',
  'Germany': 'EUR',
  'Japan': 'JPY',
  'Canada': 'CAD',
  'Australia': 'AUD',
  'Brazil': 'BRL',
  'China': 'CNY',
  'France': 'EUR',
};

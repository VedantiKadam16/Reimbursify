import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, Company, Expense, ApprovalRule } from '@/types';
import { COUNTRIES_CURRENCIES } from '@/types';
import { mockUsers, mockCompany, mockExpenses, mockApprovalRules } from '@/data/mockData';

const STORAGE_KEY = 'smart_reimburse_db_v3';

interface AppState {
  currentUser: User | null;
  company: Company | null;
  users: User[];
  expenses: Expense[];
  approvalRules: ApprovalRule[];
  isAuthenticated: boolean;
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, role: string, country: string, currency: string) => void;
  logout: () => void;
  resetData: () => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  addApprovalRule: (rule: ApprovalRule) => void;
  updateApprovalRule: (rule: ApprovalRule) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const initialState: AppState = {
    currentUser: null,
    company: mockCompany,
    users: mockUsers,
    expenses: mockExpenses,
    approvalRules: mockApprovalRules,
    isAuthenticated: false,
  };

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    return initialState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const login = useCallback((email: string, _password: string) => {
    const user = state.users.find(u => u.email === email);
    if (user) {
      setState(s => ({ ...s, currentUser: user, isAuthenticated: true }));
      return true;
    }
    return false;
  }, [state.users]);

  const signup = useCallback((name: string, email: string, role: string, country: string, currency: string) => {
    const companyId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const newCompany: Company = { id: companyId, name: `${name}'s Company`, country, currency, adminId: userId };
    const newUser: User = { id: userId, name, email, role: role as User['role'], companyId };
    setState(s => ({
      ...s,
      currentUser: newUser,
      company: newCompany,
      users: [...s.users, newUser],
      isAuthenticated: true,
    }));
  }, []);

  const logout = useCallback(() => {
    setState(s => ({ ...s, currentUser: null, isAuthenticated: false }));
  }, []);

  const resetData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  }, []);

  const addUser = useCallback((user: User) => {
    setState(s => ({ ...s, users: [...s.users, user] }));
  }, []);

  const updateUser = useCallback((user: User) => {
    setState(s => ({ ...s, users: s.users.map(u => u.id === user.id ? user : u) }));
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setState(s => ({ ...s, users: s.users.filter(u => u.id !== userId) }));
  }, []);

  const addExpense = useCallback((expense: Expense) => {
    setState(s => ({ ...s, expenses: [expense, ...s.expenses] }));
  }, []);

  const updateExpense = useCallback((expense: Expense) => {
    setState(s => ({ ...s, expenses: s.expenses.map(e => e.id === expense.id ? expense : e) }));
  }, []);

  const addApprovalRule = useCallback((rule: ApprovalRule) => {
    setState(s => ({ ...s, approvalRules: [...s.approvalRules, rule] }));
  }, []);

  const updateApprovalRule = useCallback((rule: ApprovalRule) => {
    setState(s => ({ ...s, approvalRules: s.approvalRules.map(r => r.id === rule.id ? rule : r) }));
  }, []);

  return (
    <AppContext.Provider value={{
      ...state, login, signup, logout, resetData, addUser, updateUser, deleteUser,
      addExpense, updateExpense, addApprovalRule, updateApprovalRule,
    }}>
      {children}
    </AppContext.Provider>
  );
};


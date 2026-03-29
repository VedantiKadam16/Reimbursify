import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { toast } from '@/hooks/use-toast';

interface CountryItem {
  name: string;
  currency: string;
}

const LoginPage = () => {
  const { login, signup, users } = useApp();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [countryData, setCountryData] = useState<CountryItem[]>([]);
  const [selectedCountryName, setSelectedCountryName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,currencies')
      .then(res => res.json())
      .then(data => {
        const countries: CountryItem[] = [];
        data.forEach((item: any) => {
          if (item.name?.common && item.currencies) {
            const currencyCode = Object.keys(item.currencies)[0];
            countries.push({ name: item.name.common, currency: currencyCode });
          }
        });
        countries.sort((a, b) => a.name.localeCompare(b.name));
        setCountryData(countries);
      })
      .catch(err => {
        console.error('Failed to fetch countries', err);
        setError('Failed to load country list');
      });
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(email, password);
    if (!success) {
      setError('Invalid credentials. Note: You must sign up to create your own Admin account first.');
    } else {
      toast({ title: 'Success!', description: `You have successfully logged in to the real email: ${email}` });
    }
  };

  const [role, setRole] = useState('admin');

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (!selectedCountryName) { setError('Please select a country'); return; }
    
    const countryObj = countryData.find(c => c.name === selectedCountryName);
    const currency = countryObj ? countryObj.currency : 'USD';
    
    signup(name, email, role, selectedCountryName, currency);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-4">
            <Building2 className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-foreground">SmartReimburse AI</h1>
          <p className="text-muted-foreground text-sm mt-1">Intelligent Expense Management</p>
        </div>

        <div className="bg-card rounded-xl p-8 card-elevated border border-border">
          <h2 className="text-lg font-semibold font-heading text-card-foreground mb-6">
            {isSignup ? 'Create Company Account' : 'Sign In'}
          </h2>

          {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

          <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
            <div className="grid grid-cols-3 gap-2 mb-6">
              <Button 
                type="button" 
                variant="outline" 
                className="bg-primary/10 hover:bg-primary/20 border-primary/20 text-xs" 
                onClick={() => { 
                  setRole('admin'); setEmail('admin@acme.com'); setPassword('password'); 
                  if(isSignup){ setConfirmPassword('password'); setName('Admin User'); setSelectedCountryName('United States'); }
                }}
              >
                Admin
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="bg-warning/10 hover:bg-warning/20 border-warning/20 text-xs" 
                onClick={() => { 
                  setRole('manager'); setEmail('sarah@acme.com'); setPassword('password'); 
                  if(isSignup){ setConfirmPassword('password'); setName('Sarah Manager'); setSelectedCountryName('United States'); }
                }}
              >
                Manager
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="bg-success/10 hover:bg-success/20 border-success/20 text-xs" 
                onClick={() => { 
                  setRole('employee'); setEmail('marc@acme.com'); setPassword('password'); 
                  if(isSignup){ setConfirmPassword('password'); setName('Marc Employee'); setSelectedCountryName('United States'); }
                }}
              >
                Employee
              </Button>
            </div>
            
            {isSignup && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            {isSignup && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <Input id="confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={selectedCountryName} onValueChange={setSelectedCountryName}>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {countryData.map(c => (
                        <SelectItem key={c.name} value={c.name}>{c.name} ({c.currency})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <Button type="submit" className="w-full gradient-primary text-primary-foreground">
              {isSignup ? 'Create Account' : 'Login'} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          {!isSignup && (
            <div className="mt-4 text-center">
              <button 
                type="button" 
                onClick={() => {
                  if (!email) {
                    toast({ title: 'Error', description: 'Please enter your email address first!', variant: 'destructive' });
                    return;
                  }
                  toast({ title: 'Password Reset', description: `A randomly generated unique password has been sent to ${email} !` });
                }} 
                className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{' '}
            <button type="button" onClick={() => { setIsSignup(!isSignup); setError(''); }} className="text-primary font-medium hover:underline">
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

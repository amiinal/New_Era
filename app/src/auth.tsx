// Auth state: OTP sign-in (Step 2) + optional password 2nd step.
// SecureStore is the seam: swap `memory` for expo-secure-store when installed.
import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { Account, api, setAccountId } from './api';

const memory = new Map<string, string>();
const store = {
  get: async (k: string) => memory.get(k) ?? null,
  set: async (k: string, v: string) => { memory.set(k, v); },
  del: async (k: string) => { memory.delete(k); },
};

type Ctx = {
  account: Account | null;
  pendingTo: string;
  mode: 'customer' | 'business';
  signIn: (to: string, code: string, country: string) => Promise<{ needsPassword: boolean; accountId?: string }>;
  completePassword: (accountId: string, password: string) => Promise<void>;
  applySession: (token: string, account: Account) => Promise<void>;
  signOut: () => Promise<void>;
  setAppMode: (mode: 'customer' | 'business') => Promise<void>;
  refresh: () => Promise<void>;
};
const AuthCtx = createContext<Ctx>({} as Ctx);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [pendingTo, setPendingTo] = useState('');

  // OTP first. Accounts with a password stop here and ask for it next.
  const signIn = async (to: string, code: string, country: string) => {
    const body = to.includes('@')
      ? { email: to, code, country }
      : { phone: to, code, country };
    const r = await api.verify(body);
    if ('needsPassword' in r) return { needsPassword: true, accountId: r.accountId };
    await store.set('token', r.token);
    setAccountId(r.account.id);
    setAccount(r.account);
    return { needsPassword: false };
  };
  const completePassword = async (accountId: string, password: string) => {
    const { token, account: acc } = await api.passwordLogin({ accountId, password });
    await applySession(token, acc);
  };
  const signOut = async () => {
    await store.del('token');
    setAccountId(null);
    setAccount(null);
    setPendingTo('');
  };
  // ACC-3: mode switch remembered server-side.
  const setAppMode = async (mode: 'customer' | 'business') => {
    try {
      setAccount(await api.setMode(mode));
    } catch {
      Alert.alert('Could not switch mode', 'Check the API is running, then retry.');
    }
  };
  const refresh = async () => {
    try { setAccount(await api.me()); } catch { /* keep stale */ }
  };
  const applySession = async (token: string, acc: Account) => {
    await store.set('token', token);
    setAccountId(acc.id);
    setAccount(acc);
  };
  return <AuthCtx.Provider value={{ account, pendingTo, mode: account?.lastMode ?? 'customer', signIn, completePassword, applySession, signOut, setAppMode, refresh }}>{children}</AuthCtx.Provider>;
}

// Auth state: OTP sign-in (Step 2), token persisted for real sessions.
// SecureStore is the seam: swap `memory` for expo-secure-store when installed.
import React, { createContext, useContext, useState } from 'react';
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
  signIn: (to: string, code: string, country: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestSwitch: (email: string) => Promise<void>;
};
const AuthCtx = createContext<Ctx>({} as Ctx);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [pendingTo, setPendingTo] = useState('');

  const signIn = async (to: string, code: string, country: string) => {
    const body = to.includes('@')
      ? { email: to, code, country }
      : { phone: to, code, country };
    const { token, account: acc } = await api.verify(body);
    await store.set('token', token);
    setAccountId(acc.id);
    setAccount(acc);
  };
  const signOut = async () => {
    await store.del('token');
    setAccountId(null);
    setAccount(null);
  };
  // Switch accounts: sign out and prefill the sign-in form. Close-able
  // by simply navigating back — nothing is lost.
  const requestSwitch = async (email: string) => {
    await signOut();
    setPendingTo(email);
  };
  return <AuthCtx.Provider value={{ account, pendingTo, signIn, signOut, requestSwitch }}>{children}</AuthCtx.Provider>;
}

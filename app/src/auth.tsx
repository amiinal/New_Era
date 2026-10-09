// Auth state: OTP sign-in (Step 2) + optional password 2nd step.
// Session persists on-device (SecureStore / localStorage) and is
// validated on launch — relaunching restores you where you left off.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Account, api, getRefresh, refreshSession, setTokens } from './api';
import { delFlag } from './store';

type Ctx = {
  account: Account | null;
  pendingTo: string;
  mode: 'customer' | 'business';
  restoring: boolean;
  restored: boolean;
  signIn: (to: string, code: string, country: string) => Promise<{ needsPassword: boolean; accountId?: string }>;
  completePassword: (accountId: string, password: string) => Promise<void>;
  applySession: (token: string, refreshToken: string, account: Account) => Promise<void>;
  signOut: () => Promise<void>;
  setAppMode: (mode: 'customer' | 'business') => Promise<void>;
  refresh: () => Promise<void>;
};
const AuthCtx = createContext<Ctx>({} as Ctx);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [pendingTo, setPendingTo] = useState('');
  const [restoring, setRestoring] = useState(true);
  const [restored, setRestored] = useState(false);

  // Launch: trade the saved refresh token for a live session, if any.
  useEffect(() => {
    (async () => {
      try {
        const s = await refreshSession();
        if (s) {
          setAccount(s.account);
          setRestored(true);
        }
      } finally {
        setRestoring(false);
      }
    })();
  }, []);

  // OTP first. Accounts with a password stop here and ask for it next.
  const signIn = async (to: string, code: string, country: string) => {
    const body = to.includes('@')
      ? { email: to, code, country }
      : { phone: to, code, country };
    const r = await api.verify(body);
    if ('needsPassword' in r) return { needsPassword: true, accountId: r.accountId };
    await applySession(r.token, r.refreshToken, r.account);
    return { needsPassword: false };
  };
  const completePassword = async (accountId: string, password: string) => {
    const { token, refreshToken, account: acc } = await api.passwordLogin({ accountId, password });
    await applySession(token, refreshToken, acc);
  };
  const applySession = async (token: string, refreshToken: string, acc: Account) => {
    await setTokens(token, refreshToken);
    setRestored(false);
    setAccount(acc);
  };
  const signOut = async () => {
    try { await api.logout(getRefresh()); } catch { /* already out */ }
    await setTokens(null, null);
    await delFlag('lastRoute');
    setRestored(false);
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
  return <AuthCtx.Provider value={{ account, pendingTo, mode: account?.lastMode ?? 'customer', restoring, restored, signIn, completePassword, applySession, signOut, setAppMode, refresh }}>{children}</AuthCtx.Provider>;
}

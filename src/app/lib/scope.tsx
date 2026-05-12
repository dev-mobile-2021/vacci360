import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Scope } from '../types';
import { findScope, getScopesForUser } from '../data/mockScopes';
import { useAuth } from './auth';

const STORAGE_KEY = 'vacci360.scope.currentId';

interface ScopeContextValue {
  current: Scope | null;
  available: Scope[];
  setCurrentScope: (scopeId: string) => void;
}

const ScopeContext = createContext<ScopeContextValue | null>(null);

export function ScopeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const available = useMemo(
    () => (user ? getScopesForUser(user.scopeIds) : []),
    [user],
  );

  const [currentId, setCurrentId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  // Si l'utilisateur change ou si le scope sauvegardé n'est plus accessible,
  // on aligne sur le premier scope disponible.
  useEffect(() => {
    if (!user) {
      setCurrentId(null);
      return;
    }
    if (!currentId || !user.scopeIds.includes(currentId)) {
      setCurrentId(user.scopeIds[0] ?? null);
    }
  }, [user, currentId]);

  useEffect(() => {
    if (currentId) localStorage.setItem(STORAGE_KEY, currentId);
    else localStorage.removeItem(STORAGE_KEY);
  }, [currentId]);

  const setCurrentScope = useCallback((scopeId: string) => setCurrentId(scopeId), []);

  const current = currentId ? findScope(currentId) ?? null : null;

  const value = useMemo<ScopeContextValue>(
    () => ({ current, available, setCurrentScope }),
    [current, available, setCurrentScope],
  );

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

export function useScope() {
  const ctx = useContext(ScopeContext);
  if (!ctx) throw new Error('useScope must be used within ScopeProvider');
  return ctx;
}

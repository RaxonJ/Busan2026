import { useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AdminAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    if (!supabase) {
      setState({ user: null, session: null, loading: false });
      return;
    }

    // 取得目前 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, loading: false });
    });

    // 監聽 auth 狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session, loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase 未設定');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return { ...state, signIn, signOut };
}

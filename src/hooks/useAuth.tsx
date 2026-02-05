import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

// 1. Add TypeScript definition for the Median Native Bridge
declare global {
  interface Window {
    median?: {
      socialLogin?: {
        google?: {
          login: (options: { callback: (data: any) => void }) => void;
        };
      };
    };
  }
}

export function useAuth() {
  const { user, session, isLoading, setSession, setLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setLoading]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }, []);

  // 2. Updated Google Sign In Logic
  const signInWithGoogle = useCallback(async () => {
    // A. Check if running inside Median App with Social Login Plugin
    if (window.median?.socialLogin?.google) {
      return new Promise<{ data: any; error: any }>((resolve) => {
        window.median!.socialLogin!.google!.login({
          callback: async (response: any) => {
            if (response.error) {
              resolve({ data: null, error: { message: response.error } });
              return;
            }

            // Exchange the native ID token for a Supabase session
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.idToken,
            });
            
            resolve({ data, error });
          }
        });
      });
    }

    // B. Fallback to standard web redirect (for browser testing/Desktop)
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { data, error };
  }, []);

  const signUpWithEmail = useCallback(async (
    email: string, 
    password: string, 
    fullName: string
  ) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/auth');
    }
    return { error };
  }, [navigate]);

  return {
    user,
    session,
    isLoading,
    signInWithEmail,
    signInWithGoogle,
    signUpWithEmail,
    signOut,
    isAuthenticated: !!session,
  };
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);

  return { isLoading };
}

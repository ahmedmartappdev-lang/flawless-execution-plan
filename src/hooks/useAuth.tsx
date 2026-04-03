import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

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

  const sendOtp = useCallback(async (phone: string, role?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone, role },
      });

      if (error) {
        // Parse error body from edge function non-2xx responses
        let errorMessage = 'Failed to send OTP';
        try {
          if (error.context && typeof error.context.json === 'function') {
            const body = await error.context.json();
            if (body?.error) errorMessage = body.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
        } catch {
          // ignore parse errors
        }
        return { success: false, error: errorMessage };
      }

      if (data?.error) {
        return { success: false, error: data.error };
      }

      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' };
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { phone, otp },
      });

      if (error) {
        // Parse the actual error body from the edge function response
        let errorMessage = 'Verification failed. Please try again.';
        try {
          if (error.context && typeof error.context.json === 'function') {
            const body = await error.context.json();
            if (body?.error) errorMessage = body.error;
          }
        } catch {
          // ignore parse errors, use default message
        }
        return { success: false, error: errorMessage };
      }

      if (data?.error) {
        return { success: false, error: data.error };
      }

      // Set session in Supabase client
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        return { success: false, error: 'Failed to establish session' };
      }

      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' };
    }
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
    sendOtp,
    verifyOtp,
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

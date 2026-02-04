import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { type SelectedRole, getRoleRedirectPath } from '@/hooks/useRoleValidation';

const SELECTED_ROLE_KEY = 'selectedAuthRole';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'validating' | 'redirecting'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait for the session to be established
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          toast({
            title: 'Authentication failed',
            description: 'Unable to complete sign in. Please try again.',
            variant: 'destructive',
          });
          navigate('/auth');
          return;
        }

        if (!session) {
          // No session yet, wait a bit and try again (OAuth might still be processing)
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (event === 'SIGNED_IN' && newSession) {
                subscription.unsubscribe();
                await processRoleRedirect(newSession.user.email);
              }
            }
          );
          
          // Set a timeout for safety
          setTimeout(() => {
            subscription.unsubscribe();
            navigate('/auth');
          }, 10000);
          return;
        }

        // Session exists, process the redirect
        await processRoleRedirect(session.user.email);
      } catch (error) {
        console.error('Callback error:', error);
        navigate('/');
      }
    };

    const processRoleRedirect = async (email: string | undefined) => {
      setStatus('validating');
      
      // Read the selected role from localStorage
      const storedRole = localStorage.getItem(SELECTED_ROLE_KEY) as SelectedRole | null;
      const selectedRole: SelectedRole = storedRole || 'customer';
      
      // Clear the stored role
      localStorage.removeItem(SELECTED_ROLE_KEY);

      // If customer role, just go to home
      if (selectedRole === 'customer') {
        setStatus('redirecting');
        toast({
          title: 'Welcome!',
          description: 'You have successfully signed in.',
        });
        navigate('/');
        return;
      }

      // For other roles, validate that the user has access
      if (!email) {
        toast({
          title: 'Authentication error',
          description: 'Unable to verify your account.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      // Check if user has the selected role
      const hasRole = await validateUserRole(email, selectedRole);
      
      setStatus('redirecting');
      
      if (hasRole) {
        toast({
          title: 'Welcome!',
          description: `Signed in as ${getRoleLabel(selectedRole)}.`,
        });
        navigate(getRoleRedirectPath(selectedRole));
      } else {
        toast({
          title: 'Access denied',
          description: `Your email is not registered as a ${getRoleLabel(selectedRole)}. Redirecting to home.`,
          variant: 'destructive',
        });
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground">
          {status === 'loading' && 'Completing sign in...'}
          {status === 'validating' && 'Verifying access...'}
          {status === 'redirecting' && 'Redirecting...'}
        </p>
      </div>
    </div>
  );
};

async function validateUserRole(email: string, role: SelectedRole): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  
  try {
    switch (role) {
      case 'admin': {
        const { data } = await supabase
          .from('admins')
          .select('id, status')
          .eq('email', normalizedEmail)
          .maybeSingle();
        return !!data && data.status === 'active';
      }
      case 'vendor': {
        const { data } = await supabase
          .from('vendors')
          .select('id, status')
          .eq('email', normalizedEmail)
          .maybeSingle();
        return !!data && data.status === 'active';
      }
      case 'delivery_partner': {
        const { data } = await supabase
          .from('delivery_partners')
          .select('id')
          .eq('email', normalizedEmail)
          .maybeSingle();
        return !!data;
      }
      default:
        return false;
    }
  } catch (error) {
    console.error('Role validation error:', error);
    return false;
  }
}

function getRoleLabel(role: SelectedRole): string {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'vendor':
      return 'Vendor';
    case 'delivery_partner':
      return 'Delivery Partner';
    default:
      return 'Customer';
  }
}

export default AuthCallback;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, ShoppingCart, Truck, Store, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getRoleRedirectPath, type SelectedRole } from '@/hooks/useRoleValidation';

type AuthStep = 'role-selection' | 'auth-form';

const roleOptions: { value: SelectedRole; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'customer', label: 'Customer', description: 'Shop for groceries', icon: <ShoppingCart className="w-5 h-5" /> },
  { value: 'delivery_partner', label: 'Delivery Partner', description: 'Deliver orders & earn money', icon: <Truck className="w-5 h-5" /> },
  { value: 'vendor', label: 'Vendor / Store Owner', description: 'Sell your products', icon: <Store className="w-5 h-5" /> },
  { value: 'admin', label: 'Admin', description: 'Manage platform', icon: <Shield className="w-5 h-5" /> },
];

const AuthPage: React.FC = () => {
  const [step, setStep] = useState<AuthStep>('role-selection');
  const [selectedRole, setSelectedRole] = useState<SelectedRole>('customer');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRoleSelect = (role: SelectedRole) => {
    setSelectedRole(role);
    setStep('auth-form');
  };

  const goBackToRoleSelection = () => {
    setStep('role-selection');
  };

  const handleGoogleSignIn = async () => {
    localStorage.setItem('selectedAuthRole', selectedRole);
    if (selectedRole !== 'customer') {
      toast({ title: 'Note', description: `If your email is not registered as a ${roleOptions.find(r => r.value === selectedRole)?.label}, you will be redirected to home.` });
    }
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) toast({ title: 'Google sign in failed', description: error.message, variant: 'destructive' });
    } finally { setIsGoogleLoading(false); }
  };

  const formContent = (
    <AnimatePresence mode="wait">
      {step === 'role-selection' ? (
        <motion.div key="role-selection" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">Welcome</h1>
            <p className="text-sm text-muted-foreground">Select your role to continue</p>
          </div>
          <div className="space-y-2.5">
            {roleOptions.map((role) => (
              <button key={role.value} onClick={() => handleRoleSelect(role.value)}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-border bg-background hover:bg-primary hover:text-primary-foreground transition-all text-left group">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-primary group-hover:text-primary-foreground">
                  {role.icon}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-[15px]">{role.label}</p>
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div key="auth-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">Continue</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">as</span>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {roleOptions.find(r => r.value === selectedRole)?.label}
              </span>
            </div>
          </div>

          {selectedRole !== 'customer' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
              <p className="text-xs text-amber-800 font-medium">
                {selectedRole === 'admin' && 'Admin access requires pre-registration.'}
                {selectedRole === 'vendor' && 'Vendor access requires approval.'}
                {selectedRole === 'delivery_partner' && 'Delivery Partner access requires approval.'}
              </p>
            </div>
          )}

          {/* Google Sign In */}
          <button type="button" onClick={handleGoogleSignIn} disabled={isGoogleLoading}
            className="w-full bg-background border border-border text-foreground py-3 rounded-lg font-semibold text-sm hover:bg-muted transition-all flex items-center justify-center gap-3">
            {isGoogleLoading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          <p className="text-center text-xs text-muted-foreground mt-5 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="/terms" className="underline hover:text-foreground transition-colors">Terms</a>{' & '}
            <a href="/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</a>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen w-full bg-background">
      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex min-h-screen">
        <div className="w-1/2 relative overflow-hidden">
          <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Fresh groceries" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-12 left-12 right-12">
            <img src="/logo.jpeg" alt="Logo" className="h-12 w-auto rounded-lg mb-4" />
            <h2 className="text-3xl font-bold text-white leading-tight">Fresh groceries<br />delivered to your door</h2>
            <p className="text-white/70 mt-2 text-sm">Quality products at the best prices</p>
          </div>
        </div>
        <div className="w-1/2 flex flex-col">
          <div className="absolute top-6 right-6 z-10">
            <button onClick={step === 'role-selection' ? () => navigate('/') : goBackToRoleSelection} className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-2 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-12 lg:px-20 py-12">
            <div className="w-full max-w-[400px]">{formContent}</div>
          </div>
        </div>
      </div>

      {/* MOBILE LAYOUT */}
      <div className="md:hidden min-h-screen relative">
        <div className="fixed inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Fresh groceries" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 pt-12 px-6 pb-4">
          <button onClick={step === 'role-selection' ? () => navigate('/') : goBackToRoleSelection} className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 -ml-2 transition-colors mb-4">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src="/logo.jpeg" alt="Logo" className="h-10 w-auto rounded-lg" />
        </div>
        <div className="relative z-10 mt-auto">
          <div className="bg-background rounded-t-[28px] px-6 pt-7 pb-8 min-h-[65vh] shadow-2xl">{formContent}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

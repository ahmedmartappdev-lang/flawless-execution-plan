import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, ShoppingCart, Truck, Store, ChevronRight } from 'lucide-react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getRoleRedirectPath, type SelectedRole } from '@/hooks/useRoleValidation';
import { useMobileAuthSheet } from '@/stores/mobileAuthSheetStore';

type AuthStep = 'role-selection' | 'auth-form';

const roleOptions: { value: SelectedRole; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'customer', label: 'Customer', description: 'Shop for groceries', icon: <ShoppingCart className="w-5 h-5" /> },
  { value: 'delivery_partner', label: 'Delivery Partner', description: 'Deliver orders & earn money', icon: <Truck className="w-5 h-5" /> },
  { value: 'vendor', label: 'Vendor / Store Owner', description: 'Sell your products', icon: <Store className="w-5 h-5" /> },
];

export const MobileAuthSheet: React.FC = () => {
  const { isOpen, closeAuthSheet } = useMobileAuthSheet();
  const [step, setStep] = useState<AuthStep>('role-selection');
  const [selectedRole, setSelectedRole] = useState<SelectedRole>('customer');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const resetForm = () => {
    setStep('role-selection');
    setSelectedRole('customer');
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      closeAuthSheet();
      setTimeout(resetForm, 300);
    }
  };

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

  return (
    <Drawer open={isOpen} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[80vh] px-4 pb-20 pt-1.5 rounded-t-[20px]">
        <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/20 mb-2 flex-shrink-0" />

        {step === 'auth-form' && (
          <button onClick={goBackToRoleSelection} className="text-muted-foreground hover:text-foreground mb-1 -ml-1 p-1 rounded-lg hover:bg-muted transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex justify-center mb-2">
          <img src="/logo.jpeg" alt="Logo" className="h-9 w-9 rounded-full object-cover shadow-md" />
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {step === 'role-selection' ? (
              <motion.div key="role-selection" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-foreground">Welcome</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Select your role to continue</p>
                </div>
                <div className="space-y-2">
                  {roleOptions.map((role) => (
                    <button key={role.value} onClick={() => handleRoleSelect(role.value)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all text-left group">
                      <div className="text-primary shrink-0">
                        {React.cloneElement(role.icon as React.ReactElement, { className: 'w-5 h-5' })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-[13px]">{role.label}</p>
                        <p className="text-[11px] text-muted-foreground">{role.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="auth-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-foreground">Continue</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-muted-foreground">as</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                      {roleOptions.find(r => r.value === selectedRole)?.label}
                    </span>
                  </div>
                </div>

                {selectedRole !== 'customer' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3">
                    <p className="text-[11px] text-amber-800 font-medium">
                      {selectedRole === 'vendor' && 'Vendor access requires approval.'}
                      {selectedRole === 'delivery_partner' && 'Delivery Partner access requires approval.'}
                    </p>
                  </div>
                )}

                {/* Google Sign In */}
                <button type="button" onClick={handleGoogleSignIn} disabled={isGoogleLoading}
                  className="w-full bg-background border border-border text-foreground py-2.5 rounded-lg font-semibold text-xs hover:bg-muted transition-all flex items-center justify-center gap-2">
                  {isGoogleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Continue with Google
                </button>

                <p className="text-center text-[10px] text-muted-foreground mt-3 leading-relaxed">
                  By continuing, you agree to our{' '}
                  <a href="/terms" className="underline hover:text-foreground">Terms</a>{' & '}
                  <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileAuthSheet;

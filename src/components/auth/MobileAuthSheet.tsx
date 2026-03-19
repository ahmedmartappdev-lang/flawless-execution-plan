import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowLeft, ShoppingCart, Truck, Store, ChevronRight } from 'lucide-react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { validateRoleAccess, getRoleRedirectPath, type SelectedRole } from '@/hooks/useRoleValidation';
import { useMobileAuthSheet } from '@/stores/mobileAuthSheetStore';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

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
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string; role?: string }>({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const resetForm = () => {
    setStep('role-selection');
    setSelectedRole('customer');
    setIsLogin(true);
    setEmail('');
    setPassword('');
    setFullName('');
    setShowPassword(false);
    setErrors({});
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      closeAuthSheet();
      setTimeout(resetForm, 300);
    }
  };

  const handleRoleSelect = (role: SelectedRole) => {
    setSelectedRole(role);
    setErrors({});
    setStep('auth-form');
  };

  const goBackToRoleSelection = () => {
    setStep('role-selection');
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    try { emailSchema.parse(email); } catch (e) { if (e instanceof z.ZodError) newErrors.email = e.errors[0].message; }
    try { passwordSchema.parse(password); } catch (e) { if (e instanceof z.ZodError) newErrors.password = e.errors[0].message; }
    if (!isLogin && !fullName.trim()) newErrors.fullName = 'Full name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      if (selectedRole !== 'customer') {
        const validation = await validateRoleAccess(email, selectedRole);
        if (!validation.isValid) { setErrors({ role: validation.error || 'Access denied' }); setIsLoading(false); return; }
      }
      if (isLogin) {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          toast({ title: 'Login failed', description: error.message.includes('Invalid login credentials') ? 'Invalid email or password.' : error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
          closeAuthSheet();
          navigate(getRoleRedirectPath(selectedRole));
        }
      } else {
        const { data, error } = await signUpWithEmail(email, password, fullName);
        if (error) {
          if (error.message.includes('User already registered')) { toast({ title: 'Account exists', description: 'Please log in instead.', variant: 'destructive' }); setIsLogin(true); }
          else toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Account created!', description: 'Please check your email to verify your account.' });
          if (data.session) { closeAuthSheet(); navigate(getRoleRedirectPath(selectedRole)); }
        }
      }
    } finally { setIsLoading(false); }
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
      <DrawerContent className="max-h-[80vh] px-4 pb-4 pt-1.5 rounded-t-[20px]">
        {/* Drag handle */}
        <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/20 mb-2 flex-shrink-0" />

        {/* Back button for auth-form */}
        {step === 'auth-form' && (
          <button onClick={goBackToRoleSelection} className="text-muted-foreground hover:text-foreground mb-1 -ml-1 p-1 rounded-lg hover:bg-muted transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img src="/logo.jpeg" alt="Logo" className="h-9 w-9 rounded-full object-cover shadow-md" />
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {step === 'role-selection' ? (
              <motion.div key="role-selection" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-foreground">Welcome</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Select your role to continue</p>
                </div>
                <div className="space-y-2.5">
                  {roleOptions.map((role) => (
                    <button key={role.value} onClick={() => handleRoleSelect(role.value)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all text-left group">
                      <div className="text-primary shrink-0">
                        {React.cloneElement(role.icon as React.ReactElement, { className: 'w-6 h-6' })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{role.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="auth-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-foreground">{isLogin ? 'Log in' : 'Create account'}</h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-sm text-muted-foreground">as</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {roleOptions.find(r => r.value === selectedRole)?.label}
                    </span>
                  </div>
                </div>

                {selectedRole !== 'customer' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                    <p className="text-xs text-amber-800 font-medium">
                      {selectedRole === 'vendor' && 'Vendor access requires approval.'}
                      {selectedRole === 'delivery_partner' && 'Delivery Partner access requires approval.'}
                    </p>
                  </div>
                )}

                {errors.role && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 mb-4">
                    <p className="text-xs text-destructive font-medium">{errors.role}</p>
                  </div>
                )}

                {/* Tab Switcher */}
                <div className="flex bg-muted rounded-xl p-1 mb-4">
                  <button onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${isLogin ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                    Login
                  </button>
                  <button onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${!isLogin ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <AnimatePresence mode="wait">
                    {!isLogin && (
                      <motion.div key="fullName" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-1">
                        <div className="relative group">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-background transition-all" />
                        </div>
                        {errors.fullName && <p className="text-xs text-destructive pl-1">{errors.fullName}</p>}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-1">
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input type="email" placeholder="Email Address" value={email}
                        onChange={(e) => { setEmail(e.target.value); setErrors({ ...errors, role: undefined }); }}
                        className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-background transition-all" />
                    </div>
                    {errors.email && <p className="text-xs text-destructive pl-1">{errors.email}</p>}
                  </div>

                  <div className="space-y-1">
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-background transition-all" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive pl-1">{errors.password}</p>}
                  </div>

                  <button type="submit" disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm">
                    {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" />{isLogin ? 'Logging in...' : 'Creating account...'}</>) : isLogin ? 'Login' : 'Create Account'}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs font-medium">
                    <span className="bg-background px-4 text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Google */}
                <button type="button" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}
                  className="w-full bg-background border border-border text-foreground py-3 rounded-xl font-semibold text-sm hover:bg-muted transition-all flex items-center justify-center gap-2.5">
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

                <p className="text-center text-[11px] text-muted-foreground mt-4 leading-relaxed">
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

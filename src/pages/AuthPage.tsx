import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, ShoppingCart, Truck, Store, Shield, Phone } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getRoleRedirectPath, type SelectedRole } from '@/hooks/useRoleValidation';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

type AuthStep = 'role-selection' | 'phone-input' | 'otp-input' | 'google-auth';

const roleOptions: { value: SelectedRole; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'customer', label: 'Customer', description: 'Shop for groceries', icon: <ShoppingCart className="w-5 h-5" /> },
  { value: 'delivery_partner', label: 'Delivery Partner', description: 'Deliver orders & earn money', icon: <Truck className="w-5 h-5" /> },
  { value: 'vendor', label: 'Vendor / Store Owner', description: 'Sell your products', icon: <Store className="w-5 h-5" /> },
  { value: 'admin', label: 'Admin', description: 'Manage platform', icon: <Shield className="w-5 h-5" /> },
];

const AuthPage: React.FC = () => {
  const [step, setStep] = useState<AuthStep>('role-selection');
  const [selectedRole, setSelectedRole] = useState<SelectedRole>('customer');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { sendOtp, verifyOtp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  // Handle Google OAuth callback
  useEffect(() => {
    const role = searchParams.get('role') as SelectedRole | null;
    if (user && role && (role === 'vendor' || role === 'admin')) {
      // User just came back from Google OAuth
      validateEmailRole(user.email || '', role).then((hasRole) => {
        if (hasRole) {
          toast({ title: 'Welcome!', description: 'You have successfully signed in.' });
          navigate(getRoleRedirectPath(role));
        } else {
          toast({
            title: 'Access denied',
            description: `Your Google account is not registered as ${roleOptions.find(r => r.value === role)?.label}. Contact admin for access.`,
            variant: 'destructive',
          });
          supabase.auth.signOut();
          navigate('/auth');
        }
      });
    }
  }, [user, searchParams]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(prev => prev - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleRoleSelect = (role: SelectedRole) => {
    setSelectedRole(role);
    if (role === 'vendor' || role === 'admin') {
      setStep('google-auth');
    } else {
      setStep('phone-input');
    }
  };

  const goBack = () => {
    if (step === 'otp-input') {
      setStep('phone-input');
      setOtp('');
    } else if (step === 'phone-input' || step === 'google-auth') {
      setStep('role-selection');
      setPhoneNumber('');
    } else {
      navigate('/');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle(selectedRole);
    setIsGoogleLoading(false);
    if (error) {
      toast({ title: 'Sign in failed', description: error, variant: 'destructive' });
    }
    // OAuth will redirect, so no further action needed on success
  };

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) {
      toast({ title: 'Invalid number', description: 'Enter a valid 10-digit phone number.', variant: 'destructive' });
      return;
    }
    setIsSending(true);
    const { success, error } = await sendOtp(phoneNumber, selectedRole);
    setIsSending(false);
    if (success) {
      setStep('otp-input');
      setResendTimer(30);
      toast({ title: 'OTP Sent', description: `OTP sent to +91 ${phoneNumber}` });
    } else {
      toast({ title: 'Failed to send OTP', description: error || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setIsVerifying(true);
    const { success, error } = await verifyOtp(phoneNumber, otp);
    setIsVerifying(false);
    if (success) {
      toast({ title: 'Welcome!', description: 'You have successfully signed in.' });
      if (selectedRole === 'customer') {
        navigate('/');
      } else {
        const hasRole = await validatePhoneRole(phoneNumber, selectedRole);
        if (hasRole) {
          navigate(getRoleRedirectPath(selectedRole));
        } else {
          toast({ title: 'Access denied', description: `Your number is not registered as ${roleOptions.find(r => r.value === selectedRole)?.label}. Redirecting to home.`, variant: 'destructive' });
          navigate('/');
        }
      }
    } else {
      toast({ title: 'Verification failed', description: error || 'Invalid OTP.', variant: 'destructive' });
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setIsSending(true);
    const { success, error } = await sendOtp(phoneNumber);
    setIsSending(false);
    if (success) {
      setResendTimer(30);
      toast({ title: 'OTP Resent', description: `New OTP sent to +91 ${phoneNumber}` });
    } else {
      toast({ title: 'Failed', description: error || 'Please try again.', variant: 'destructive' });
    }
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
                <div className="flex-1">
                  <p className="font-semibold text-foreground group-hover:text-primary-foreground text-[15px]">{role.label}</p>
                  <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/70">{role.description}</p>
                </div>
                {(role.value === 'vendor' || role.value === 'admin') && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground group-hover:bg-primary-foreground/20 group-hover:text-primary-foreground">Google</span>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      ) : step === 'google-auth' ? (
        <motion.div key="google-auth" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">Sign in with Google</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">as</span>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {roleOptions.find(r => r.value === selectedRole)?.label}
              </span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
            <p className="text-xs text-amber-800 font-medium">
              {selectedRole === 'admin' && 'Admin access requires pre-registration. Your Google email must be registered by a super admin.'}
              {selectedRole === 'vendor' && 'Vendor access requires approval. Your Google email must be registered in the vendor directory.'}
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 bg-background border border-border py-3 rounded-lg font-semibold text-sm hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
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
      ) : step === 'phone-input' ? (
        <motion.div key="phone-input" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">Enter Phone Number</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">as</span>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {roleOptions.find(r => r.value === selectedRole)?.label}
              </span>
            </div>
          </div>

          {selectedRole === 'delivery_partner' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
              <p className="text-xs text-amber-800 font-medium">Delivery Partner access requires approval.</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 h-10 rounded-lg border border-input bg-background text-sm font-medium text-muted-foreground shrink-0">
                <Phone className="w-4 h-4" />
                +91
              </div>
              <Input
                type="tel"
                placeholder="Enter 10-digit number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                className="flex-1"
                autoFocus
              />
            </div>
            <button
              onClick={handleSendOtp}
              disabled={phoneNumber.length !== 10 || isSending}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Send OTP
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-5 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="/terms" className="underline hover:text-foreground transition-colors">Terms</a>{' & '}
            <a href="/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</a>
          </p>
        </motion.div>
      ) : (
        <motion.div key="otp-input" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">Verify OTP</h1>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to <span className="font-medium text-foreground">+91 {phoneNumber}</span>
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || isVerifying}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Verify & Continue
            </button>

            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-xs text-muted-foreground">Resend OTP in <span className="font-medium text-foreground">{resendTimer}s</span></p>
              ) : (
                <button onClick={handleResendOtp} disabled={isSending} className="text-xs text-primary font-medium hover:underline">
                  {isSending ? 'Sending...' : 'Resend OTP'}
                </button>
              )}
            </div>
          </div>
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
            <button onClick={goBack} className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-2 transition-colors">
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
          <button onClick={goBack} className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 -ml-2 transition-colors mb-4">
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

async function validatePhoneRole(phone: string, role: SelectedRole): Promise<boolean> {
  const fullPhone = `+91${phone}`;
  try {
    switch (role) {
      case 'delivery_partner': {
        const { data } = await supabase.from('delivery_partners').select('id').eq('phone', fullPhone).maybeSingle();
        return !!data;
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

async function validateEmailRole(email: string, role: SelectedRole): Promise<boolean> {
  if (!email) return false;
  try {
    switch (role) {
      case 'admin': {
        const { data } = await supabase.from('admins').select('id, status').eq('email', email).maybeSingle();
        return !!data && data.status === 'active';
      }
      case 'vendor': {
        const { data } = await supabase.from('vendors').select('id, status').eq('email', email).maybeSingle();
        return !!data && data.status === 'active';
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export default AuthPage;

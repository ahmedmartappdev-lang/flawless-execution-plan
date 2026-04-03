import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, ShoppingCart, Truck, Store, ChevronRight, Phone } from 'lucide-react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getRoleRedirectPath, type SelectedRole } from '@/hooks/useRoleValidation';
import { useMobileAuthSheet } from '@/stores/mobileAuthSheetStore';
import { supabase } from '@/integrations/supabase/client';

type AuthStep = 'role-selection' | 'phone-input' | 'otp-input';

const roleOptions: { value: SelectedRole; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'customer', label: 'Customer', description: 'Shop for groceries', icon: <ShoppingCart className="w-5 h-5" /> },
  { value: 'delivery_partner', label: 'Delivery Partner', description: 'Deliver orders & earn money', icon: <Truck className="w-5 h-5" /> },
  { value: 'vendor', label: 'Vendor / Store Owner', description: 'Sell your products', icon: <Store className="w-5 h-5" /> },
];

export const MobileAuthSheet: React.FC = () => {
  const { isOpen, closeAuthSheet } = useMobileAuthSheet();
  const [step, setStep] = useState<AuthStep>('role-selection');
  const [selectedRole, setSelectedRole] = useState<SelectedRole>('customer');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const { sendOtp, verifyOtp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const resetForm = () => {
    setStep('role-selection');
    setSelectedRole('customer');
    setPhoneNumber('');
    setOtp('');
    setResendTimer(0);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      closeAuthSheet();
      setTimeout(resetForm, 300);
    }
  };

  const handleRoleSelect = (role: SelectedRole) => {
    setSelectedRole(role);
    setStep('phone-input');
  };

  const goBack = () => {
    if (step === 'otp-input') {
      setStep('phone-input');
      setOtp('');
    } else if (step === 'phone-input') {
      setStep('role-selection');
      setPhoneNumber('');
    }
  };

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) {
      toast({ title: 'Invalid number', description: 'Enter a valid 10-digit phone number.', variant: 'destructive' });
      return;
    }
    setIsSending(true);
    // For non-customer roles, verify phone is registered in the role table first
    if (selectedRole !== 'customer') {
      const hasRole = await validatePhoneRole(`+91${phoneNumber}`, selectedRole);
      if (!hasRole) {
        setIsSending(false);
        toast({ title: 'Not registered', description: `This number is not registered as ${roleOptions.find(r => r.value === selectedRole)?.label}. Contact admin for access.`, variant: 'destructive' });
        return;
      }
    }
    const { success, error } = await sendOtp(phoneNumber);
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
      closeAuthSheet();
      toast({ title: 'Welcome!', description: 'You have successfully signed in.' });
      if (selectedRole === 'customer') {
        navigate('/');
      } else {
        const fullPhone = `+91${phoneNumber}`;
        const hasRole = await validatePhoneRole(fullPhone, selectedRole);
        if (hasRole) {
          navigate(getRoleRedirectPath(selectedRole));
        } else {
          toast({ title: 'Access denied', description: `Not registered as ${roleOptions.find(r => r.value === selectedRole)?.label}.`, variant: 'destructive' });
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
      toast({ title: 'OTP Resent' });
    } else {
      toast({ title: 'Failed', description: error || 'Try again.', variant: 'destructive' });
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[85vh] px-4 pb-20 pt-1.5 rounded-t-[20px]">
        <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/20 mb-2 flex-shrink-0" />

        {step !== 'role-selection' && (
          <button onClick={goBack} className="text-muted-foreground hover:text-foreground mb-1 -ml-1 p-1 rounded-lg hover:bg-muted transition-colors w-fit">
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
            ) : step === 'phone-input' ? (
              <motion.div key="phone-input" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-foreground">Enter Phone Number</h2>
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

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2.5 h-10 rounded-lg border border-input bg-background text-xs font-medium text-muted-foreground shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                      +91
                    </div>
                    <Input
                      type="tel"
                      placeholder="10-digit number"
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
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold text-xs hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Send OTP
                  </button>
                </div>

                <p className="text-center text-[10px] text-muted-foreground mt-3 leading-relaxed">
                  By continuing, you agree to our{' '}
                  <a href="/terms" className="underline hover:text-foreground">Terms</a>{' & '}
                  <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>
                </p>
              </motion.div>
            ) : (
              <motion.div key="otp-input" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-foreground">Verify OTP</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Code sent to <span className="font-medium text-foreground">+91 {phoneNumber}</span>
                  </p>
                </div>

                <div className="space-y-4">
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
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold text-xs hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Verify & Continue
                  </button>

                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <p className="text-[10px] text-muted-foreground">Resend in <span className="font-medium text-foreground">{resendTimer}s</span></p>
                    ) : (
                      <button onClick={handleResendOtp} disabled={isSending} className="text-[10px] text-primary font-medium hover:underline">
                        {isSending ? 'Sending...' : 'Resend OTP'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

async function validatePhoneRole(phone: string, role: SelectedRole): Promise<boolean> {
  try {
    switch (role) {
      case 'admin': {
        const { data } = await supabase.from('admins').select('id, status').eq('phone', phone).maybeSingle();
        return !!data && data.status === 'active';
      }
      case 'vendor': {
        const { data } = await supabase.from('vendors').select('id, status').eq('phone', phone).maybeSingle();
        return !!data && data.status === 'active';
      }
      case 'delivery_partner': {
        const { data } = await supabase.from('delivery_partners').select('id').eq('phone', phone).maybeSingle();
        return !!data;
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export default MobileAuthSheet;

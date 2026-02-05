import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowLeft, ShoppingCart, Truck, Store, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { validateRoleAccess, getRoleRedirectPath, type SelectedRole } from '@/hooks/useRoleValidation';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AuthStep = 'role-selection' | 'auth-form';

const roleOptions: { value: SelectedRole; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'customer',
    label: 'Customer',
    description: 'Shop for groceries',
    icon: <ShoppingCart className="w-5 h-5" />,
  },
  {
    value: 'delivery_partner',
    label: 'Delivery Partner',
    description: 'Deliver orders & earn money',
    icon: <Truck className="w-5 h-5" />,
  },
  {
    value: 'vendor',
    label: 'Vendor / Store Owner',
    description: 'Sell your products',
    icon: <Store className="w-5 h-5" />,
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Manage platform',
    icon: <Shield className="w-5 h-5" />,
  },
];

const AuthPage: React.FC = () => {
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
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    if (!isLogin && !fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // For non-customer roles, validate that email is pre-registered
      if (selectedRole !== 'customer') {
        const validation = await validateRoleAccess(email, selectedRole);
        if (!validation.isValid) {
          setErrors({ role: validation.error || 'Access denied' });
          setIsLoading(false);
          return;
        }
      }

      if (isLogin) {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Login failed',
              description: 'Invalid email or password. Please try again.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Login failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully logged in.',
          });
          navigate(getRoleRedirectPath(selectedRole));
        }
      } else {
        const { data, error } = await signUpWithEmail(email, password, fullName);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: 'Account exists',
              description: 'An account with this email already exists. Please log in.',
              variant: 'destructive',
            });
            setIsLogin(true);
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Account created!',
            description: 'Please check your email to verify your account.',
          });
          if (data.session) {
            navigate(getRoleRedirectPath(selectedRole));
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Save selected role to localStorage before OAuth redirect
    // This will be read by the AuthCallback page after Google redirects back
    localStorage.setItem('selectedAuthRole', selectedRole);
    
    // For non-customer roles with Google, we can't validate email beforehand
    // The validation will happen after OAuth redirect
    if (selectedRole !== 'customer') {
      toast({
        title: 'Note',
        description: `If your email is not registered as a ${roleOptions.find(r => r.value === selectedRole)?.label}, you will be redirected to home.`,
      });
    }
    
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: 'Google sign in failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center font-sans relative overflow-hidden">
      {/* BACKGROUND (Blinkit Style) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')` 
        }}
      />
      <div className="absolute inset-0 z-0 bg-black/60 backdrop-blur-[2px]" />

      {/* MODAL CONTAINER */}
      <div className="relative z-10 w-full max-w-[420px] bg-white rounded-[24px] p-6 shadow-2xl mx-4 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto hide-scrollbar">
        
        {/* Back Button */}
        <div 
          className="absolute top-6 left-6 cursor-pointer text-[#333] hover:bg-gray-100 rounded-full p-2 -ml-2 transition-colors z-20"
          onClick={step === 'role-selection' ? () => navigate('/') : goBackToRoleSelection}
        >
          <ArrowLeft className="w-5 h-5" />
        </div>

        {/* LOGO (Blinkit Yellow Box) */}
        <div className="mt-2 mb-6 flex justify-center">
          <div className="bg-[#F8CB46] text-black font-black px-4 py-2 rounded-[10px] text-[18px] tracking-tight shadow-sm select-none">
            Ahmad Mart
          </div>
        </div>

        <main className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 'role-selection' ? (
              <motion.div
                key="role-selection"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <div className="text-center mb-6">
                  <h1 className="text-[22px] font-extrabold text-[#1c1c1c] mb-1 leading-tight">
                    India's last minute app
                  </h1>
                  <p className="text-[14px] text-[#666] font-medium">
                    Select your role to continue
                  </p>
                </div>

                {/* Role Selection Grid */}
                <div className="space-y-3">
                  {roleOptions.map((role) => (
                    <button
                      key={role.value}
                      onClick={() => handleRoleSelect(role.value)}
                      className="w-full flex items-center gap-4 p-4 rounded-[16px] border border-[#e0e0e0] bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#1c1c1c] group-hover:bg-[#F8CB46] group-hover:text-black transition-colors">
                        {role.icon}
                      </div>
                      <div>
                        <p className="font-bold text-[#1c1c1c] text-[15px]">{role.label}</p>
                        <p className="text-[12px] text-[#828282]">{role.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="auth-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <div className="text-center mb-6">
                  <h1 className="text-[22px] font-extrabold text-[#1c1c1c] mb-1 leading-tight">
                    {isLogin ? 'Log in' : 'Sign up'}
                  </h1>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-[13px] text-[#666]">as</span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[#1c1c1c] text-[12px] font-bold border border-gray-200 flex items-center gap-1">
                      {roleOptions.find(r => r.value === selectedRole)?.label}
                    </span>
                  </div>
                </div>

                {/* Info for non-customer roles */}
                {selectedRole !== 'customer' && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-[12px] p-3 mb-6">
                    <p className="text-[11px] text-yellow-800 text-center font-medium leading-tight">
                      {selectedRole === 'admin' && 'Admin access requires pre-registration.'}
                      {selectedRole === 'vendor' && 'Vendor access requires approval.'}
                      {selectedRole === 'delivery_partner' && 'Delivery Partner access requires approval.'}
                    </p>
                  </div>
                )}

                {/* Errors */}
                {errors.role && (
                  <div className="bg-red-50 border border-red-100 rounded-[12px] p-3 mb-4">
                    <p className="text-[12px] text-red-600 text-center font-medium">{errors.role}</p>
                  </div>
                )}

                {/* Custom Tab Switcher (Styled) */}
                <div className="flex bg-gray-100 rounded-[12px] p-1 mb-6">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-bold transition-all ${
                      isLogin
                        ? 'bg-white text-[#1c1c1c] shadow-sm'
                        : 'text-[#828282] hover:text-[#666]'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-bold transition-all ${
                      !isLogin
                        ? 'bg-white text-[#1c1c1c] shadow-sm'
                        : 'text-[#828282] hover:text-[#666]'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence mode="wait">
                    {!isLogin && (
                      <motion.div
                        key="fullName"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1"
                      >
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9c9c9c] group-focus-within:text-[#1c1c1c] transition-colors" />
                          <input
                            id="fullName"
                            type="text"
                            placeholder="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-white border border-[#e0e0e0] rounded-[12px] py-3.5 pl-12 pr-4 text-[15px] text-[#1c1c1c] placeholder:text-[#9c9c9c] outline-none focus:border-[#0c831f] transition-colors font-medium"
                          />
                        </div>
                        {errors.fullName && (
                          <p className="text-[11px] text-red-500 pl-1">{errors.fullName}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-1">
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9c9c9c] group-focus-within:text-[#1c1c1c] transition-colors" />
                      <input
                        id="email"
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrors({ ...errors, role: undefined });
                        }}
                        className="w-full bg-white border border-[#e0e0e0] rounded-[12px] py-3.5 pl-12 pr-4 text-[15px] text-[#1c1c1c] placeholder:text-[#9c9c9c] outline-none focus:border-[#0c831f] transition-colors font-medium"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[11px] text-red-500 pl-1">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9c9c9c] group-focus-within:text-[#1c1c1c] transition-colors" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border border-[#e0e0e0] rounded-[12px] py-3.5 pl-12 pr-12 text-[15px] text-[#1c1c1c] placeholder:text-[#9c9c9c] outline-none focus:border-[#0c831f] transition-colors font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9c9c9c] hover:text-[#1c1c1c]"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-[11px] text-red-500 pl-1">{errors.password}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#0c831f] text-white py-4 rounded-[12px] font-bold text-[16px] hover:bg-[#096e1a] transition-all shadow-lg shadow-green-100 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isLogin ? 'Logging in...' : 'Creating account...'}
                      </>
                    ) : isLogin ? (
                      'Login'
                    ) : (
                      'Continue'
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#eee]" />
                  </div>
                  <div className="relative flex justify-center text-[11px] font-medium uppercase tracking-wider">
                    <span className="bg-white px-2 text-[#9c9c9c]">Or continue with</span>
                  </div>
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isLoading}
                  className="w-full bg-white border border-[#e0e0e0] text-[#1c1c1c] py-3.5 rounded-[12px] font-bold text-[15px] hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#666]" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  Google
                </button>

                {/* Footer text */}
                <p className="text-center text-[11px] text-[#828282] mt-6 leading-relaxed">
                  By continuing, you agree to our{' '}
                  <a href="#" className="underline hover:text-[#1c1c1c] transition-colors">
                    Terms of Service
                  </a>{' '}
                  &{' '}
                  <a href="#" className="underline hover:text-[#1c1c1c] transition-colors">
                    Privacy Policy
                  </a>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AuthPage;

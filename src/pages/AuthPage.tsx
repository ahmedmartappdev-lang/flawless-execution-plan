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
    icon: <ShoppingCart className="w-6 h-6" />,
  },
  {
    value: 'delivery_partner',
    label: 'Delivery Partner',
    description: 'Deliver orders & earn money',
    icon: <Truck className="w-6 h-6" />,
  },
  {
    value: 'vendor',
    label: 'Vendor / Store Owner',
    description: 'Sell your products',
    icon: <Store className="w-6 h-6" />,
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Manage platform',
    icon: <Shield className="w-6 h-6" />,
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
    // Save selected role just in case for both flows
    localStorage.setItem('selectedAuthRole', selectedRole);
    
    setIsGoogleLoading(true);
    try {
      const { data, error } = await signInWithGoogle();
      
      if (error) {
        toast({
          title: 'Google sign in failed',
          description: error.message,
          variant: 'destructive',
        });
      } else if (data?.session) {
        // NATIVE FLOW SUCCESS:
        // We are still on the page, so we must manually handle the redirect.
        
        // 1. For non-customer roles, validate access immediately
        if (selectedRole !== 'customer') {
          const email = data.session.user.email;
          if (email) {
            const validation = await validateRoleAccess(email, selectedRole);
            if (!validation.isValid) {
              toast({
                title: 'Access Denied',
                description: validation.error || `You are not registered as a ${selectedRole}.`,
                variant: 'destructive',
              });
              // Optional: You could trigger a signOut here if you want to be strict
              return; 
            }
          }
        }

        // 2. Success! Navigate to the correct dashboard
        toast({
          title: 'Welcome!',
          description: `You have successfully logged in as ${selectedRole}.`,
        });
        navigate(getRoleRedirectPath(selectedRole));
      }
      // Note: If no data.session is returned, it means the Web Redirect flow 
      // has taken over (browser is handling the redirect), so we do nothing here.
      
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={step === 'role-selection' ? () => navigate('/') : goBackToRoleSelection}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center px-6 py-8">
        <AnimatePresence mode="wait">
          {step === 'role-selection' ? (
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="max-w-sm mx-auto w-full"
            >
              {/* Logo/Branding */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🛒</span>
                </div>
                <h1 className="text-2xl font-bold text-foreground">Ahmed Mart</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Groceries delivered in 10 minutes
                </p>
              </div>

              {/* Role Selection */}
              <div className="space-y-3">
                <p className="text-center text-sm text-muted-foreground mb-4">
                  Continue as:
                </p>
                {roleOptions.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => handleRoleSelect(role.value)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {role.icon}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{role.label}</p>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
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
              className="max-w-sm mx-auto w-full"
            >
              {/* Selected Role Badge */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center gap-2">
                  {roleOptions.find(r => r.value === selectedRole)?.icon}
                  {roleOptions.find(r => r.value === selectedRole)?.label}
                </div>
              </div>

              {/* Info for non-customer roles */}
              {selectedRole !== 'customer' && (
                <div className="bg-muted/50 border border-border rounded-lg p-3 mb-6">
                  <p className="text-xs text-muted-foreground text-center">
                    {selectedRole === 'admin' && 'Admin access requires pre-registration by an existing admin.'}
                    {selectedRole === 'vendor' && 'Vendor access requires pre-registration by an admin.'}
                    {selectedRole === 'delivery_partner' && 'Delivery partner access requires pre-registration by an admin.'}
                  </p>
                </div>
              )}

              {/* Role Validation Error */}
              {errors.role && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-6">
                  <p className="text-xs text-destructive text-center">{errors.role}</p>
                </div>
              )}

              {/* Tab Switcher */}
              <div className="flex bg-muted rounded-xl p-1 mb-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    isLogin
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    !isLogin
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground'
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
                      className="space-y-2"
                    >
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-xs text-destructive">{errors.fullName}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors({ ...errors, role: undefined });
                      }}
                      className="pl-10"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {isLogin ? 'Logging in...' : 'Creating account...'}
                    </>
                  ) : isLogin ? (
                    'Login'
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                size="lg"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
                Continue with Google
              </Button>

              {/* Footer text */}
              <p className="text-center text-xs text-muted-foreground mt-6">
                By continuing, you agree to our{' '}
                <a href="#" className="text-primary hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AuthPage;

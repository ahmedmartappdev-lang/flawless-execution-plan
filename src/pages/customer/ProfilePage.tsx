import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, Package, LogOut, ChevronRight, Camera, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCustomerCredits } from '@/hooks/useCustomerCredits';
import { sanitizePhone } from '@/lib/phone';

interface ProfileData {
  full_name: string;
  phone: string;
  profile_image_url: string | null;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { signOut } = useAuth();
  const { creditBalance } = useCustomerCredits();

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const [formData, setFormData] = useState<ProfileData>({
    full_name: '',
    phone: '',
    profile_image_url: null,
  });

  // Keep original values to detect changes / allow cancel
  const [originalData, setOriginalData] = useState<ProfileData>({
    full_name: '',
    phone: '',
    profile_image_url: null,
  });

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return;
      try {
        setIsLoading(true);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (error) throw error;
        if (profile) {
          const d: ProfileData = {
            full_name: profile.full_name || '',
            phone: sanitizePhone(profile.phone || ''),
            profile_image_url: profile.profile_image_url,
          };
          setFormData(d);
          setOriginalData(d);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile details');
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  const handleSaveName = async () => {
    if (!user?.id) return;
    if (!formData.full_name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    try {
      setIsSavingName(true);
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: formData.full_name.trim(), updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (error) throw error;
      setOriginalData((prev) => ({ ...prev, full_name: formData.full_name.trim() }));
      toast.success('Name updated successfully');
      setIsEditingName(false);
    } catch {
      toast.error('Failed to update name');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!user) return null;

  return (
    <CustomerLayout hideBottomNav={false}>
      <main className="max-w-[1000px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* LEFT SIDEBAR */}
          <div className="md:col-span-4 space-y-4">
            {/* Profile Summary Card — show name + phone */}
            <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="w-24 h-24 border-4 border-[#f8f8f8]">
                  <AvatarImage src={formData.profile_image_url || undefined} />
                  <AvatarFallback className="text-2xl bg-[#f1f7ff] text-primary font-bold">
                    {formData.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h2 className="text-xl font-bold text-foreground">{formData.full_name || 'Guest User'}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {formData.phone ? `+91 ${formData.phone}` : 'No phone added'}
              </p>
            </div>

            {/* Credit Balance Card */}
            <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-[#f1f7ff] p-2 rounded-full text-primary"><Wallet className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">{creditBalance < 0 ? 'Due Amount' : 'Credit Balance'}</p>
                    <p className={`text-lg font-bold ${creditBalance < 0 ? 'text-destructive' : ''}`}>
                      {creditBalance < 0 ? '-' : ''}₹{Math.abs(creditBalance).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button onClick={() => navigate('/credit-history')} className="text-sm text-primary font-medium">
                  History <ChevronRight className="w-4 h-4 inline" />
                </button>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="bg-white border border-[#e8e8e8] rounded-[12px] overflow-hidden">
              <button onClick={() => navigate('/orders')} className="w-full flex items-center justify-between p-4 hover:bg-muted/50 border-b border-[#f0f0f0] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-[#eef9f1] p-2 rounded-full text-primary"><Package className="w-5 h-5" /></div>
                  <span className="font-semibold text-foreground">My Orders</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <button onClick={() => navigate('/addresses')} className="w-full flex items-center justify-between p-4 hover:bg-muted/50 border-b border-[#f0f0f0] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-[#fffce5] p-2 rounded-full text-[#f8cb46]"><MapPin className="w-5 h-5" /></div>
                  <span className="font-semibold text-foreground">Saved Addresses</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 hover:bg-red-50 text-red-600 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-full"><LogOut className="w-5 h-5" /></div>
                  <span className="font-semibold">Log Out</span>
                </div>
                <ChevronRight className="w-4 h-4 text-red-300" />
              </button>
            </div>
          </div>

          {/* RIGHT CONTENT — Individual fields with own save */}
          <div className="md:col-span-8 space-y-4">
            {/* Full Name */}
            <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-6">
              <div className="flex items-center justify-between mb-3">
                <Label htmlFor="full_name" className="text-muted-foreground font-medium">Full Name</Label>
                {!isEditingName ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingName(true)}>Edit</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setFormData((p) => ({ ...p, full_name: originalData.full_name })); setIsEditingName(false); }}>Cancel</Button>
                    <Button size="sm" onClick={handleSaveName} disabled={isSavingName}>
                      {isSavingName ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </div>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                  disabled={!isEditingName}
                  className="pl-10 bg-muted/30 border-border h-11 disabled:opacity-80"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-6">
              <Label htmlFor="phone" className="text-muted-foreground font-medium mb-3 block">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone}
                  readOnly
                  disabled
                  className="pl-10 bg-muted/30 border-border h-11 opacity-80"
                  type="tel"
                />
              </div>
              <p className="text-xs text-muted-foreground ml-1 mt-1">Phone number used during login cannot be changed</p>
            </div>

            {/* Promo */}
            <div className="bg-[#f1f7ff] border border-[#dcecfc] rounded-[12px] p-4 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-foreground">Get Ahmad Mart Membership</h4>
                <p className="text-sm text-muted-foreground">Free delivery on every order above ₹99</p>
              </div>
              <Button className="bg-black text-white hover:bg-gray-800 h-9 text-sm">Explore</Button>
            </div>
          </div>
        </div>
      </main>
    </CustomerLayout>
  );
};

export default ProfilePage;

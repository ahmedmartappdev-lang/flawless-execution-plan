import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, Package, LogOut, ChevronRight, Wallet, Info, FileText, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { Footer } from '@/components/customer/Footer';
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
      <div className="bg-white min-h-screen pb-6">
        
        {/* Header Profile Section */}
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-white">
          <Avatar className="w-16 h-16 border-2 border-primary/10">
            <AvatarImage src={formData.profile_image_url || undefined} />
            <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
              {formData.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{formData.full_name || 'Guest User'}</h1>
            <p className="text-gray-500 text-sm">{formData.phone ? `+91 ${formData.phone}` : 'No phone'}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditingName(!isEditingName)}>
            {isEditingName ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        {isEditingName && (
           <div className="p-6 border-b border-gray-100 bg-gray-50">
             <Label className="mb-2 block">Full Name</Label>
             <div className="flex gap-2">
               <Input 
                 value={formData.full_name} 
                 onChange={(e) => setFormData(p => ({...p, full_name: e.target.value}))} 
                 className="bg-white"
               />
               <Button onClick={handleSaveName} disabled={isSavingName}>Save</Button>
             </div>
           </div>
        )}

        <div className="p-4 space-y-2 max-w-3xl mx-auto">
          {/* Menu Items (Swiggy Style List) */}
          <div className="bg-white rounded-xl overflow-hidden mb-4">
            <div 
              onClick={() => navigate('/credit-history')}
              className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors border-b border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Ahmad Credit</h3>
                  <p className={`text-sm ${creditBalance < 0 ? 'text-destructive font-medium' : 'text-gray-500'}`}>
                    Balance: {creditBalance < 0 ? '-' : ''}₹{Math.abs(creditBalance).toLocaleString()}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            <div 
              onClick={() => navigate('/orders')}
              className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors border-b border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-2 rounded-full text-gray-700">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">My Orders</h3>
                  <p className="text-sm text-gray-500">Track and view previous orders</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            <div 
              onClick={() => navigate('/addresses')}
              className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-2 rounded-full text-gray-700">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Saved Addresses</h3>
                  <p className="text-sm text-gray-500">Add or remove delivery addresses</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl overflow-hidden mt-6">
            <div 
              onClick={handleLogout}
              className="flex items-center justify-between p-4 hover:bg-red-50 active:bg-red-100 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="bg-red-100 p-2 rounded-full text-red-600">
                  <LogOut className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-red-600">Log Out</h3>
              </div>
            </div>
          </div>
        </div>

      </div>
      
      {/* Footer ONLY rendered here */}
      <Footer />
    </CustomerLayout>
  );
};

export default ProfilePage;

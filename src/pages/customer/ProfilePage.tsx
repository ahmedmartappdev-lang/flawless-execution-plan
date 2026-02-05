import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Package, LogOut, ChevronRight, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfileData {
  full_name: string;
  phone: string;
  email: string;
  profile_image_url: string | null;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { signOut } = useAuth();
  
  // State for edit mode and data
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<ProfileData>({
    full_name: '',
    phone: '',
    email: '',
    profile_image_url: null
  });

  // Fetch profile data on mount
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

        const email = user.email || '';

        if (profile) {
          setFormData({
            full_name: profile.full_name || '',
            phone: profile.phone || '',
            email: email,
            profile_image_url: profile.profile_image_url
          });
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

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Strict validation for phone number
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: numericValue }));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Save
  const handleSave = async () => {
    if (!user?.id) return;

    if (formData.phone.length !== 10) {
      toast.error('Phone number must be strictly 10 digits');
      return;
    }

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!user) return null;

  return (
    <CustomerLayout hideBottomNav={false}>

      {/* --- MAIN PROFILE CONTENT --- */}
      <main className="max-w-[1000px] mx-auto px-4 py-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* LEFT SIDEBAR (Navigation) */}
          <div className="md:col-span-4 space-y-4">
            {/* Profile Summary Card */}
            <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-6 text-center">
               <div className="relative inline-block mb-4">
                  <Avatar className="w-24 h-24 border-4 border-[#f8f8f8]">
                    <AvatarImage src={formData.profile_image_url || undefined} />
                    <AvatarFallback className="text-2xl bg-[#f1f7ff] text-[#0c831f] font-bold">
                      {formData.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 bg-[#0c831f] text-white p-2 rounded-full shadow-md hover:bg-[#096e1a]">
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
               </div>
               <h2 className="text-xl font-bold text-[#1f1f1f]">{formData.full_name || 'Guest User'}</h2>
               <p className="text-sm text-[#666] mt-1">{formData.phone || 'No phone added'}</p>
            </div>

            {/* Navigation Menu */}
            <div className="bg-white border border-[#e8e8e8] rounded-[12px] overflow-hidden">
               <button onClick={() => navigate('/orders')} className="w-full flex items-center justify-between p-4 hover:bg-[#f8f8f8] border-b border-[#f0f0f0] transition-colors">
                 <div className="flex items-center gap-3">
                   <div className="bg-[#eef9f1] p-2 rounded-full text-[#0c831f]"><Package className="w-5 h-5" /></div>
                   <span className="font-semibold text-[#333]">My Orders</span>
                 </div>
                 <ChevronRight className="w-4 h-4 text-[#999]" />
               </button>
               
               <button onClick={() => navigate('/addresses')} className="w-full flex items-center justify-between p-4 hover:bg-[#f8f8f8] border-b border-[#f0f0f0] transition-colors">
                 <div className="flex items-center gap-3">
                   <div className="bg-[#fffce5] p-2 rounded-full text-[#f8cb46]"><MapPin className="w-5 h-5" /></div>
                   <span className="font-semibold text-[#333]">Saved Addresses</span>
                 </div>
                 <ChevronRight className="w-4 h-4 text-[#999]" />
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

          {/* RIGHT CONTENT (Profile Form) */}
          <div className="md:col-span-8">
            <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-extrabold text-[#1f1f1f]">My Profile</h3>
                {!isEditing ? (
                  <Button 
                    variant="outline" 
                    className="border-[#0c831f] text-[#0c831f] hover:bg-[#eef9f1] hover:text-[#0c831f]"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button 
                      className="bg-[#0c831f] hover:bg-[#096e1a] text-white"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="full_name" className="text-[#666] font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
                    <Input
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="pl-10 bg-[#f8f8f8] border-[#efefef] h-11 focus-visible:ring-[#0c831f] focus-visible:border-[#0c831f] disabled:opacity-80"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone" className="text-[#666] font-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="pl-10 bg-[#f8f8f8] border-[#efefef] h-11 focus-visible:ring-[#0c831f] focus-visible:border-[#0c831f] disabled:opacity-80"
                      placeholder="10-digit mobile number"
                      type="tel"
                      maxLength={10}
                    />
                  </div>
                  {isEditing && <p className="text-xs text-[#666] ml-1">Must be 10 digits</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-[#666] font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
                    <Input
                      id="email"
                      name="email"
                      value={formData.email}
                      disabled={true}
                      className="pl-10 bg-[#f1f1f1] border-[#efefef] h-11 text-[#666]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Promo / Info Section below form */}
            <div className="mt-6 bg-[#f1f7ff] border border-[#dcecfc] rounded-[12px] p-4 flex items-center justify-between">
               <div>
                 <h4 className="font-bold text-[#1f1f1f]">Get Ahmad Mart Membership</h4>
                 <p className="text-sm text-[#666]">Free delivery on every order above ₹99</p>
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

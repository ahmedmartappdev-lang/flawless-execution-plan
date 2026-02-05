import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, Package, LogOut, ChevronRight, Camera, Search, ShoppingCart, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BottomNavigation } from '@/components/customer/BottomNavigation';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
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
  const { user, signOut } = useAuthStore();
  const { items } = useCartStore();
  
  // State for edit mode and data
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white text-[#1f1f1f] font-sans pb-20">
      
      {/* --- BLINKIT STYLE HEADER --- */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#eeeeee] px-[4%] py-2.5 flex items-center h-[80px]">
        <div className="text-[32px] font-black tracking-tighter cursor-pointer select-none mr-10" onClick={() => navigate('/')}>
          <span className="text-[#f8cb46]">blink</span>
          <span className="text-[#0c831f]">it</span>
        </div>

        <div className="hidden lg:flex flex-col border-l border-[#ddd] pl-5 min-w-[200px] cursor-pointer">
          <span className="font-extrabold text-[14px]">Delivery in 15 minutes</span>
          <span className="text-[13px] text-[#666] whitespace-nowrap overflow-hidden text-ellipsis flex items-center">
            Knowledge Park II, Greater... <ChevronDown className="w-3 h-3 ml-1" />
          </span>
        </div>

        <div className="flex-grow mx-10 relative hidden md:block">
          <Search className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#888] w-4 h-4" />
          <input 
            type="text" 
            className="w-full bg-[#f8f8f8] border border-[#efefef] rounded-[10px] py-[14px] pl-[45px] pr-[14px] text-[14px] outline-none focus:border-[#0c831f] transition-colors"
            placeholder="Search for products"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>

        <div className="flex items-center gap-[25px] ml-auto">
          <div className="hidden md:flex items-center gap-1 font-semibold text-[16px] cursor-pointer text-[#0c831f]" onClick={() => navigate('/profile')}>
            Account <ChevronDown className="w-4 h-4" />
          </div>
          <button 
            className="bg-[#0c831f] text-white px-[18px] py-[12px] rounded-[8px] font-bold border-none flex items-center gap-[10px] cursor-pointer hover:bg-[#096e1a]"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">My Cart</span>
            {items.length > 0 && (
              <div className="bg-white text-[#0c831f] text-xs font-bold px-1.5 py-0.5 rounded-full">
                {items.length}
              </div>
            )}
          </button>
        </div>
      </header>

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
                 <h4 className="font-bold text-[#1f1f1f]">Get Blinkit Membership</h4>
                 <p className="text-sm text-[#666]">Free delivery on every order above ₹99</p>
               </div>
               <Button className="bg-black text-white hover:bg-gray-800 h-9 text-sm">Explore</Button>
            </div>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;

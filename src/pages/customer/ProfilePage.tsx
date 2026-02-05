import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, Camera, Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BottomNavigation } from '@/components/customer/BottomNavigation';
import { useAuthStore } from '@/stores/authStore';
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
  
  // State for edit mode and data
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<ProfileData>({
    full_name: '',
    phone: '',
    email: '', // Email is usually read-only
    profile_image_url: null
  });

  // Fetch profile data on mount
  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        
        // Fetch profile details
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        // Fetch email from auth user if not in profile (or just use auth email)
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
      // Remove any non-digit characters
      const numericValue = value.replace(/\D/g, '');
      
      // Limit to 10 digits
      if (numericValue.length <= 10) {
        setFormData(prev => ({
          ...prev,
          [name]: numericValue
        }));
      }
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle Save
  const handleSave = async () => {
    if (!user?.id) return;

    // Validate phone number length
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

  // Handle Cancel
  const handleCancel = () => {
    setIsEditing(false);
    // Ideally, you would reset the form data to the original fetched values here.
    // For now, we leave it as is, or you could refetch/reset if you stored original state.
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
        <p className="mb-4">Please log in to view your profile.</p>
        <Button onClick={() => navigate('/auth')}>Go to Login</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">My Profile</h1>
          {isEditing ? (
             <div className="ml-auto flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </Button>
             </div>
          ) : (
            <Button 
              variant="ghost" 
              className="ml-auto text-primary font-medium" 
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Profile Info Card */}
        <Card>
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                <AvatarImage src={formData.profile_image_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {formData.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="absolute bottom-0 right-0 rounded-full w-8 h-8 shadow-md"
                  onClick={() => toast.info('Image upload coming soon!')}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {!isEditing && (
              <div className="text-center">
                <h2 className="text-xl font-bold">{formData.full_name || 'User'}</h2>
                <p className="text-muted-foreground">{formData.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="pl-9"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="pl-9"
                  placeholder="Enter your 10-digit phone number"
                  type="tel"
                  maxLength={10}
                />
              </div>
              {isEditing && (
                 <p className="text-xs text-muted-foreground ml-1">
                   Format: 10 digits only
                 </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled={true} // Email is usually not editable directly
                  className="pl-9 bg-muted/50"
                />
              </div>
              {isEditing && (
                <p className="text-xs text-muted-foreground ml-1">
                  Email cannot be changed directly.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Address Link */}
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/addresses')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Saved Addresses</p>
                <p className="text-sm text-muted-foreground">Manage your delivery locations</p>
              </div>
            </div>
            <ArrowLeft className="w-5 h-5 text-muted-foreground rotate-180" />
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;

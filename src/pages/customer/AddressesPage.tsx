import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BottomNavigation } from '@/components/customer/BottomNavigation';
import { AddressForm } from '@/components/customer/AddressForm';
import { useAddresses, Address } from '@/hooks/useAddresses'; // Assuming this hook exists
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AddressesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addresses, isLoading, deleteAddress } = useAddresses();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>(undefined);

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingAddress(undefined);
    setIsDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    setEditingAddress(undefined);
    toast.success(editingAddress ? 'Address updated' : 'Address added');
  };

  return (
    <div className="min-h-screen bg-muted pb-20">
      <header className="sticky top-0 z-40 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Saved Addresses</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Add New Address Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2" size="lg" onClick={handleAddNew}>
              <Plus className="w-5 h-5" />
              Add New Address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            </DialogHeader>
            <AddressForm 
              onSuccess={handleFormSuccess} 
              initialData={editingAddress}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Address List */}
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No addresses saved</h3>
            <p className="text-muted-foreground">Add an address to speed up checkout</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <Card key={address.id} className="relative group overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold capitalize flex items-center gap-1">
                          {address.address_type === 'home' && <MapPin className="w-3 h-3" />}
                          {address.address_type}
                        </span>
                        {address.is_default && (
                          <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-snug">
                        {address.address_line1}
                        {address.address_line2 && `, ${address.address_line2}`}
                        <br />
                        {address.city}, {address.state} - {address.pincode}
                        {address.landmark && <br />}
                        {address.landmark && <span className="text-xs italic">Near {address.landmark}</span>}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-8 text-xs"
                      onClick={() => handleEdit(address)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this address?')) {
                          deleteAddress.mutate(address.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default AddressesPage;

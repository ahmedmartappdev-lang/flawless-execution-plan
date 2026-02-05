import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { AddressForm } from '@/components/customer/AddressForm';
import { useAddresses, Address, AddressInput } from '@/hooks/useAddresses';
import { useAuth } from '@/hooks/useAuth';

const AddressesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addresses, isLoading, addAddress, updateAddress, deleteAddress } = useAddresses();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = (data: AddressInput) => {
    if (editingAddress) {
      updateAddress.mutate({ id: editingAddress.id, ...data }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingAddress(null);
        }
      });
    } else {
      addAddress.mutate(data, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingAddress(null);
        }
      });
    }
  };

  return (
    <CustomerLayout hideBottomNav={false}>
      <header className="sticky top-0 z-40 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Saved Addresses</h1>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-24">
        {/* Add New Address Button */}
        <Button className="w-full gap-2" size="lg" onClick={handleAddNew}>
          <Plus className="w-5 h-5" />
          Add New Address
        </Button>
        
        <AddressForm 
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleFormSubmit}
          initialData={editingAddress}
          isLoading={addAddress.isPending || updateAddress.isPending}
        />

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
                      className="flex-1 h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
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
    </CustomerLayout>
  );
};

export default AddressesPage;

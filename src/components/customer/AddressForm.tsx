import React, { useState } from 'react';
import { useServiceAreas } from '@/hooks/useServiceAreas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Home, Briefcase, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MapPicker, type MapPickerResult } from '@/components/ui/map-picker';
import type { Address, AddressInput } from '@/hooks/useAddresses';

const addressSchema = z.object({
  address_type: z.string().min(1, 'Select address type'),
  address_line1: z.string().min(5, 'Enter complete address'),
  address_line2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2, 'Enter city'),
  state: z.string().min(2, 'Enter state'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter valid 6-digit pincode'),
  is_default: z.boolean(),
});

type FormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddressInput) => void;
  initialData?: Address | null;
  isLoading?: boolean;
}

const addressTypes = [
  { value: 'home', label: 'Home', icon: Home },
  { value: 'work', label: 'Work', icon: Briefcase },
  { value: 'other', label: 'Other', icon: MapPin },
];

export const AddressForm: React.FC<AddressFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialData?.latitude && initialData?.longitude
      ? { lat: initialData.latitude, lng: initialData.longitude }
      : null
  );
  const [isServiceable, setIsServiceable] = useState(true);
  const { isLocationServiceable } = useServiceAreas();

  const form = useForm<FormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      address_type: initialData?.address_type || 'home',
      address_line1: initialData?.address_line1 || '',
      address_line2: initialData?.address_line2 || '',
      landmark: initialData?.landmark || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      pincode: initialData?.pincode || '',
      is_default: initialData?.is_default || false,
    },
  });

  React.useEffect(() => {
    if (open && initialData) {
      form.reset({
        address_type: initialData.address_type,
        address_line1: initialData.address_line1,
        address_line2: initialData.address_line2 || '',
        landmark: initialData.landmark || '',
        city: initialData.city,
        state: initialData.state,
        pincode: initialData.pincode,
        is_default: initialData.is_default,
      });
      setCoords(
        initialData.latitude && initialData.longitude
          ? { lat: initialData.latitude, lng: initialData.longitude }
          : null
      );
    } else if (open && !initialData) {
      form.reset({
        address_type: 'home',
        address_line1: '',
        address_line2: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        is_default: false,
      });
      setCoords(null);
    }
  }, [open, initialData, form]);

  const handleLocationSelect = (result: MapPickerResult) => {
    setCoords({ lat: result.latitude, lng: result.longitude });
    if (result.address_line1) form.setValue('address_line1', result.address_line1);
    if (result.address_line2) form.setValue('address_line2', result.address_line2);
    if (result.city) form.setValue('city', result.city);
    if (result.state) form.setValue('state', result.state);
    if (result.pincode) form.setValue('pincode', result.pincode);
  };

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      address_type: values.address_type,
      address_line1: values.address_line1,
      address_line2: values.address_line2 || null,
      landmark: values.landmark || null,
      city: values.city,
      state: values.state,
      pincode: values.pincode,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      is_default: values.is_default,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Address' : 'Add New Address'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Map Picker */}
            <MapPicker
              onLocationSelect={handleLocationSelect}
              onServiceabilityChange={(ok) => setIsServiceable(ok)}
              checkServiceability={isLocationServiceable}
              initialLat={coords?.lat}
              initialLng={coords?.lng}
              height="200px"
            />

            {/* Address Type */}
            <FormField
              control={form.control}
              name="address_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Type</FormLabel>
                  <div className="flex gap-2">
                    {addressTypes.map((type) => (
                      <Button
                        key={type.value}
                        type="button"
                        variant={field.value === type.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => field.onChange(type.value)}
                        className="flex-1"
                      >
                        <type.icon className="w-4 h-4 mr-1" />
                        {type.label}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address Line 1 */}
            <FormField
              control={form.control}
              name="address_line1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flat / House No. / Building *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter flat/house no" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address Line 2 */}
            <FormField
              control={form.control}
              name="address_line2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street / Area / Colony</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter street/area" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Landmark */}
            <FormField
              control={form.control}
              name="landmark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Landmark</FormLabel>
                  <FormControl>
                    <Input placeholder="Nearby landmark" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City & State */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pincode */}
            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode *</FormLabel>
                  <FormControl>
                    <Input placeholder="6-digit pincode" maxLength={6} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Default Address */}
            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    Set as default address
                  </FormLabel>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading || !isServiceable}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {!isServiceable ? 'Area Not Serviceable' : initialData ? 'Update Address' : 'Save Address'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

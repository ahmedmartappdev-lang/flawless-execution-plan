import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/ui/image-upload';
import type { Database } from '@/integrations/supabase/types';
import type { ProductVariant } from '@/types/database';
import { useTimeSlots, useSaveProductTimeSlots, useProductTimeSlots } from '@/hooks/useTimeSlots';

type ProductStatus = Database['public']['Enums']['product_status'];
type UnitType = Database['public']['Enums']['unit_type'];

const productSchemaBase = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(200),
  description: z.string().max(2000).optional(),
  brand: z.string().max(100).optional(),
  sku: z.string().min(1, 'SKU is required').max(50),
  mrp: z.coerce.number().positive('MRP must be positive'),
  selling_price: z.coerce.number().positive('Selling price must be positive'),
  admin_selling_price: z.coerce.number().min(0).optional(),
  stock_quantity: z.coerce.number().min(0).default(0),
  min_order_quantity: z.coerce.number().min(1).default(1),
  max_order_quantity: z.coerce.number().min(1).default(10),
  unit_type: z.enum(['kg', 'g', 'l', 'ml', 'piece', 'pack', 'dozen']).optional(),
  unit_value: z.coerce.number().positive().optional(),
  category_id: z.string().optional(),
  primary_image_url: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'out_of_stock', 'discontinued']).default('active'),
  is_featured: z.boolean().default(false),
  is_trending: z.boolean().default(false),
});

const productSchema = productSchemaBase
  .refine((data) => data.selling_price <= data.mrp, {
    message: 'Selling price cannot exceed MRP',
    path: ['selling_price'],
  })
  .refine((data) => !data.admin_selling_price || data.admin_selling_price <= data.mrp, {
    message: 'Admin selling price cannot exceed MRP',
    path: ['admin_selling_price'],
  });

type ProductFormValues = z.infer<typeof productSchemaBase>;

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId?: string;
  editProduct?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    brand: string | null;
    sku: string;
    mrp: number;
    selling_price: number;
    admin_selling_price?: number | null;
    stock_quantity: number;
    min_order_quantity: number | null;
    max_order_quantity: number | null;
    unit_type: UnitType | null;
    unit_value: number | null;
    category_id: string | null;
    primary_image_url: string | null;
    status: ProductStatus;
    is_featured: boolean | null;
    is_trending: boolean | null;
    vendor_id: string;
    variants?: ProductVariant[] | null;
  } | null;
}

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

const generateSKU = () => {
  return `SKU-${Date.now().toString(36).toUpperCase()}`;
};

export const ProductForm: React.FC<ProductFormProps> = ({
  open,
  onOpenChange,
  vendorId,
  editProduct,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!editProduct;

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedTimeSlotIds, setSelectedTimeSlotIds] = useState<string[]>([]);
  const { data: allTimeSlots } = useTimeSlots();
  const { data: existingProductTimeSlots } = useProductTimeSlots(editProduct?.id);
  const saveProductTimeSlots = useSaveProductTimeSlots();

  const addVariant = () => {
    setVariants(prev => [...prev, {
      id: crypto.randomUUID(),
      label: '',
      unit_value: 1,
      unit_type: 'piece' as any,
      mrp: 0,
      selling_price: 0,
      stock_quantity: 0,
    }]);
  };

  const updateVariant = (id: string, field: keyof ProductVariant, value: any) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVariant = (id: string) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const { data: categories } = useQuery({
    queryKey: ['categories-for-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, parent_id')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      return data || [];
    },
  });

  // Two-step category selection
  const parentCats = categories?.filter(c => !c.parent_id) || [];
  const getSubcategories = (parentId: string) =>
    categories?.filter(c => c.parent_id === parentId) || [];

  const [selectedParentCatId, setSelectedParentCatId] = useState<string>('none');

  const subcatsForSelected = selectedParentCatId !== 'none'
    ? getSubcategories(selectedParentCatId)
    : [];

  const { data: vendors } = useQuery({
    queryKey: ['vendors-for-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('vendors')
        .select('id, business_name')
        .eq('status', 'active')
        .order('business_name');
      return data || [];
    },
    enabled: !vendorId,
  });

  const form = useForm<ProductFormValues & { vendor_id?: string }>({
    resolver: zodResolver(
      vendorId
        ? productSchema
        : productSchemaBase.extend({
            vendor_id: z.string().uuid('Vendor is required'),
          }).refine((data) => data.selling_price <= data.mrp, {
            message: 'Selling price cannot exceed MRP',
            path: ['selling_price'],
          })
    ),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      brand: '',
      sku: generateSKU(),
      mrp: 0,
      selling_price: 0,
      admin_selling_price: 0,
      stock_quantity: 0,
      min_order_quantity: 1,
      max_order_quantity: 10,
      unit_type: 'piece',
      unit_value: 1,
      category_id: 'none',
      primary_image_url: '',
      status: 'active',
      is_featured: false,
      is_trending: false,
      vendor_id: vendorId || '',
    },
  });

  useEffect(() => {
    if (editProduct) {
      form.reset({
        name: editProduct.name,
        slug: editProduct.slug,
        description: editProduct.description || '',
        brand: editProduct.brand || '',
        sku: editProduct.sku,
        mrp: editProduct.mrp,
        selling_price: editProduct.selling_price,
        admin_selling_price: editProduct.admin_selling_price || 0,
        stock_quantity: editProduct.stock_quantity,
        min_order_quantity: editProduct.min_order_quantity || 1,
        max_order_quantity: editProduct.max_order_quantity || 10,
        unit_type: editProduct.unit_type || 'piece',
        unit_value: editProduct.unit_value || 1,
        category_id: editProduct.category_id || 'none',
        primary_image_url: editProduct.primary_image_url || '',
        status: editProduct.status,
        is_featured: editProduct.is_featured || false,
        is_trending: editProduct.is_trending || false,
        vendor_id: editProduct.vendor_id,
      });
      setVariants(editProduct.variants || []);
    } else {
      form.reset({
        name: '',
        slug: '',
        description: '',
        brand: '',
        sku: generateSKU(),
        mrp: 0,
        selling_price: 0,
        admin_selling_price: 0,
        stock_quantity: 0,
        min_order_quantity: 1,
        max_order_quantity: 10,
        unit_type: 'piece',
        unit_value: 1,
        category_id: 'none',
        primary_image_url: '',
        status: 'active',
        is_featured: false,
        is_trending: false,
        vendor_id: vendorId || '',
      });
      setVariants([]);
      setSelectedParentCatId('none');
    }
  }, [editProduct, form, vendorId]);

  // Sync parent category selector when editing and categories load
  useEffect(() => {
    if (editProduct?.category_id && categories) {
      const cat = categories.find(c => c.id === editProduct.category_id);
      if (cat?.parent_id) {
        setSelectedParentCatId(cat.parent_id);
      } else if (cat) {
        setSelectedParentCatId(cat.id);
      }
    }
  }, [editProduct, categories]);

  const nameValue = form.watch('name');
  useEffect(() => {
    if (!isEditing && nameValue) {
      form.setValue('slug', generateSlug(nameValue));
    }
  }, [nameValue, isEditing, form]);

  const mrpValue = form.watch('mrp');
  const sellingPriceValue = form.watch('selling_price');
  const discountPercentage =
    mrpValue > 0 && sellingPriceValue > 0
      ? Math.round(((mrpValue - sellingPriceValue) / mrpValue) * 100)
      : 0;

  const mutation = useMutation({
    mutationFn: async (values: ProductFormValues & { vendor_id?: string }) => {
      const payload: any = {
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        brand: values.brand || null,
        sku: values.sku,
        mrp: values.mrp,
        selling_price: values.selling_price,
        discount_percentage: discountPercentage,
        stock_quantity: values.stock_quantity,
        min_order_quantity: values.min_order_quantity,
        max_order_quantity: values.max_order_quantity,
        unit_type: values.unit_type || null,
        unit_value: values.unit_value || null,
        category_id: values.category_id === 'none' ? null : values.category_id || null,
        primary_image_url: values.primary_image_url || null,
        status: values.status as ProductStatus,
        is_featured: values.is_featured,
        is_trending: values.is_trending,
        vendor_id: vendorId || values.vendor_id!,
        variants: variants.length > 0 ? variants : null,
      };

      // Only admin can set admin_selling_price
      if (!vendorId) {
        payload.admin_selling_price = values.admin_selling_price || null;
      }

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: `Product ${isEditing ? 'updated' : 'created'} successfully` });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to ${isEditing ? 'update' : 'create'} product`,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: ProductFormValues & { vendor_id?: string }) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Product' : 'Add Product'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="product-slug" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Product description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <Input placeholder="Brand name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="SKU-XXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="mrp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MRP (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="selling_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col justify-end">
                <p className="text-sm text-muted-foreground mb-1">Discount</p>
                <p className="text-lg font-semibold text-green-600">
                  {discountPercentage > 0 ? `${discountPercentage}% OFF` : '-'}
                </p>
              </div>
            </div>

            {!vendorId && (
              <FormField
                control={form.control}
                name="admin_selling_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Selling Price (₹) — Price shown to customers</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" placeholder="Leave 0 to hide product from customers" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="stock_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_order_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Order</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_order_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Order</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Type</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="piece">Piece</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                        <SelectItem value="dozen">Dozen</SelectItem>
                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                        <SelectItem value="g">Gram (g)</SelectItem>
                        <SelectItem value="l">Liter (l)</SelectItem>
                        <SelectItem value="ml">Milliliter (ml)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Value</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Parent Category</label>
                <Select
                  value={selectedParentCatId}
                  onValueChange={(val) => {
                    setSelectedParentCatId(val);
                    form.setValue('category_id', val);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {parentCats.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {subcatsForSelected.length > 0 && (
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory</FormLabel>
                      <Select value={field.value || selectedParentCatId} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subcategory" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={selectedParentCatId}>
                            Direct under {parentCats.find(p => p.id === selectedParentCatId)?.name}
                          </SelectItem>
                          {subcatsForSelected.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>
                              {sub.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!vendorId && (
              <FormField
                control={form.control}
                name="vendor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendors?.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.business_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Variants Section */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Product Variants</h4>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <Plus className="w-3 h-3 mr-1" /> Add Variant
                </Button>
              </div>
              {variants.length === 0 && (
                <p className="text-xs text-muted-foreground">No variants added. The base product price will be used.</p>
              )}
              {variants.map((variant, idx) => (
                <div key={variant.id} className="border rounded-md p-3 space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Variant {idx + 1}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeVariant(variant.id)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Label</label>
                      <Input
                        placeholder="e.g. 250g, 500ml"
                        value={variant.label}
                        onChange={(e) => updateVariant(variant.id, 'label', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Unit Value</label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={variant.unit_value}
                        onChange={(e) => updateVariant(variant.id, 'unit_value', Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Unit Type</label>
                      <select
                        value={variant.unit_type}
                        onChange={(e) => updateVariant(variant.id, 'unit_type', e.target.value)}
                        className="w-full h-8 text-sm border rounded-md px-2 bg-background"
                      >
                        <option value="piece">Piece</option>
                        <option value="pack">Pack</option>
                        <option value="dozen">Dozen</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="l">l</option>
                        <option value="ml">ml</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">MRP (₹)</label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={variant.mrp}
                        onChange={(e) => updateVariant(variant.id, 'mrp', Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Selling Price (₹)</label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={variant.selling_price}
                        onChange={(e) => updateVariant(variant.id, 'selling_price', Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Stock</label>
                      <Input
                        type="number"
                        min={0}
                        value={variant.stock_quantity}
                        onChange={(e) => updateVariant(variant.id, 'stock_quantity', Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="primary_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Image</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      bucket="product-images"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-6">
              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Featured</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_trending"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Trending</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

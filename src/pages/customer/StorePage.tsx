import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { ProductCard } from '@/components/customer/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, Star, Store } from 'lucide-react';
import type { Product } from '@/types/database';

const StorePage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();

  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, business_name, store_photo_url, owner_photo_url, store_address, rating')
        .eq('id', vendorId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['vendor-products', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(name, slug), vendor:vendors(business_name)')
        .eq('vendor_id', vendorId!)
        .in('status', ['active', 'out_of_stock'])
        .not('admin_selling_price', 'is', null)
        .order('is_featured', { ascending: false });
      if (error) throw error;
      return data as unknown as Product[];
    },
    enabled: !!vendorId,
  });

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-secondary md:bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-bold text-foreground truncate">
            {vendorLoading ? 'Loading...' : vendor?.business_name || 'Store'}
          </h1>
        </div>

        {/* Vendor Info Banner */}
        {vendor && (
          <div className="bg-card mx-4 mt-4 rounded-2xl overflow-hidden shadow-sm border border-border">
            {(vendor.store_photo_url || vendor.owner_photo_url) ? (
              <img
                src={vendor.store_photo_url || vendor.owner_photo_url || ''}
                alt={vendor.business_name}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-primary/10 flex items-center justify-center">
                <Store className="w-16 h-16 text-primary/40" />
              </div>
            )}
            <div className="p-4">
              <h2 className="text-lg font-bold text-foreground">{vendor.business_name}</h2>
              {vendor.store_address && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {vendor.store_address}
                </p>
              )}
              {vendor.rating != null && vendor.rating > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {vendor.rating}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="px-4 mt-4">
          <h3 className="text-sm font-bold text-foreground mb-3">
            {productsLoading ? '' : `${products?.length || 0} Products`}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {productsLoading
              ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-56 rounded-xl" />)
              : products?.map((product) => (
                  <div key={product.id} onClick={() => navigate(`/product/${product.slug}`)} className="cursor-pointer">
                    <ProductCard product={product} />
                  </div>
                ))}
          </div>
          {!productsLoading && (!products || products.length === 0) && (
            <p className="text-center text-muted-foreground py-12 text-sm">No products available from this store.</p>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default StorePage;

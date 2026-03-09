import React from 'react';
import { Store } from 'lucide-react';

interface FeaturedStore {
  id: string;
  business_name: string;
  owner_photo_url?: string | null;
  store_address?: string | null;
  rating?: number | null;
}

interface FeaturedStoresSectionProps {
  stores?: FeaturedStore[] | null;
}

export const FeaturedStoresSection: React.FC<FeaturedStoresSectionProps> = ({ stores }) => {
  if (!stores || stores.length === 0) return null;

  return (
    <section className="py-4 px-4">
      <h3 className="text-base font-bold text-foreground mb-3">Top Picks For You</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {stores.map((store) => (
          <div
            key={store.id}
            className="border border-border rounded-xl p-4 bg-card hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-muted overflow-hidden mb-2.5 mx-auto">
              {store.owner_photo_url ? (
                <img src={store.owner_photo_url} alt={store.business_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <h4 className="text-sm font-semibold text-center truncate">{store.business_name}</h4>
            {store.store_address && (
              <p className="text-xs text-muted-foreground text-center truncate mt-0.5">{store.store_address}</p>
            )}
            {store.rating && (
              <div className="flex items-center justify-center gap-1 mt-1.5">
                <span className="text-xs">⭐</span>
                <span className="text-xs font-medium text-muted-foreground">{store.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

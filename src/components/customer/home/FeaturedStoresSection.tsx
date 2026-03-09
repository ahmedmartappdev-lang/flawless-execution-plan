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
    <section className="py-4">
      <h3 className="px-4 text-base font-bold text-foreground mb-3">Top Picks For You</h3>
      <div className="flex justify-around px-4">
        {stores.map((store) => (
          <div key={store.id} className="flex flex-col items-center gap-1.5 cursor-pointer group">
            <div className="w-16 h-16 rounded-full border border-border overflow-hidden flex items-center justify-center bg-muted group-hover:shadow-md transition-shadow">
              {store.owner_photo_url ? (
                <img src={store.owner_photo_url} alt={store.business_name} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <p className="text-[11px] font-semibold text-foreground text-center truncate max-w-[70px]">
              {store.business_name}
            </p>
            {store.rating && (
              <div className="flex items-center gap-0.5">
                <span className="text-yellow-500 text-[10px]">★</span>
                <span className="text-[10px] font-medium text-muted-foreground">{store.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

import React from 'react';
import { Store, ChevronRight } from 'lucide-react';

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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[17px] font-bold text-foreground">Top Picks For You</h3>
        <button className="flex items-center gap-0.5 text-sm font-semibold text-primary hover:underline">
          See all <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {stores.map((store) => (
          <div
            key={store.id}
            className="min-w-[150px] max-w-[150px] flex-shrink-0 rounded-2xl bg-card border border-border/60 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
          >
            {/* Store image */}
            <div className="h-[100px] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
              {store.owner_photo_url ? (
                <img
                  src={store.owner_photo_url}
                  alt={store.business_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-background/80 flex items-center justify-center shadow-sm">
                  <Store className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Store info */}
            <div className="p-2.5">
              <h4 className="text-[13px] font-bold text-foreground truncate leading-tight">
                {store.business_name}
              </h4>
              {store.store_address && (
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {store.store_address}
                </p>
              )}
              {store.rating && (
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                    ★ {store.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

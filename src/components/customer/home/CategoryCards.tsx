import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Category } from '@/types/database';

interface CategoryCardsProps {
  categories?: Category[] | null;
  isLoading: boolean;
}

export const CategoryCards: React.FC<CategoryCardsProps> = ({ categories, isLoading }) => {
  const navigate = useNavigate();

  return (
    <section className="py-4 px-4">
      <h3 className="text-base font-bold text-foreground mb-3">Shop by Categories</h3>

      {isLoading ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="w-full aspect-square rounded-full" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      ) : !categories || categories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No categories found.</div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
              onClick={() => navigate(`/category/${cat.slug}`)}
            >
              <div className="w-full aspect-square rounded-full bg-muted/60 overflow-hidden flex items-center justify-center p-3 group-hover:shadow-md transition-shadow">
                <img
                  src={cat.image_url || cat.icon_url || '/placeholder.svg'}
                  alt={cat.name}
                  className="w-full h-full object-contain drop-shadow-sm"
                />
              </div>
              <p className="text-[11px] font-semibold text-foreground text-center leading-tight line-clamp-2 px-0.5">
                {cat.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

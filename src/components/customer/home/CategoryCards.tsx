import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Category } from '@/types/database';

const CARD_COLORS = [
  'bg-red-50 text-red-800',
  'bg-green-50 text-green-800',
  'bg-gray-100 text-gray-800',
  'bg-amber-50 text-amber-800',
  'bg-blue-50 text-blue-800',
  'bg-purple-50 text-purple-800',
  'bg-orange-50 text-orange-800',
  'bg-teal-50 text-teal-800',
];

interface CategoryCardsProps {
  categories?: Category[] | null;
  isLoading: boolean;
}

export const CategoryCards: React.FC<CategoryCardsProps> = ({ categories, isLoading }) => {
  const navigate = useNavigate();

  return (
    <section className="py-4">
      <h3 className="px-4 text-base font-bold text-foreground mb-3">Shop by Categories</h3>

      {isLoading ? (
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="min-w-[110px] h-[120px] rounded-2xl flex-shrink-0" />
          ))}
        </div>
      ) : !categories || categories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground px-4">No categories found.</div>
      ) : (
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              className={`min-w-[110px] h-[120px] rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex-shrink-0 ${CARD_COLORS[index % CARD_COLORS.length]}`}
              onClick={() => navigate(`/category/${cat.slug}`)}
            >
              <p className="text-[13px] font-semibold leading-tight z-[2]">{cat.name}</p>
              <img
                src={cat.image_url || cat.icon_url || '/placeholder.svg'}
                alt={cat.name}
                className="w-[70px] absolute bottom-1 right-0 z-[1] drop-shadow-sm"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

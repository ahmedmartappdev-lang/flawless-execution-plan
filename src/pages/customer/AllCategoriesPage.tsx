import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { useCategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';

const CARD_GRADIENTS = [
  'from-rose-100 to-rose-50',
  'from-emerald-100 to-emerald-50',
  'from-amber-100 to-amber-50',
  'from-sky-100 to-sky-50',
  'from-violet-100 to-violet-50',
  'from-orange-100 to-orange-50',
  'from-teal-100 to-teal-50',
  'from-pink-100 to-pink-50',
];

const AllCategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: categories, isLoading } = useCategories();

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">All Categories</h1>
        </header>

        <div className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="h-[130px] rounded-xl" />
              ))}
            </div>
          ) : !categories || categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No categories found.</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {categories.map((cat, index) => (
                <div
                  key={cat.id}
                  className={`relative rounded-xl overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 bg-gradient-to-b ${CARD_GRADIENTS[index % CARD_GRADIENTS.length]}`}
                  onClick={() => navigate(`/category/${cat.slug}`)}
                >
                  <div className="pt-3 px-3 flex items-center justify-center h-[85px]">
                    <img
                      src={cat.image_url || cat.icon_url || '/placeholder.svg'}
                      alt={cat.name}
                      className="max-h-[70px] w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="px-2 pb-2.5 pt-1">
                    <p className="text-[11px] font-semibold text-foreground text-center leading-tight line-clamp-2">
                      {cat.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default AllCategoriesPage;

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/customer/ProductCard';
import { Product, Category } from '@/types/database';

interface ProductGridSectionProps {
  title: string;
  products?: (Product & { category: Category })[] | null;
  isLoading: boolean;
}

export const ProductGridSection: React.FC<ProductGridSectionProps> = ({
  title,
  products,
  isLoading,
}) => {
  return (
    <section className="py-4 px-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <span className="text-primary font-semibold text-sm cursor-pointer hover:underline">see all</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[240px] rounded-xl" />
          ))}
        </div>
      ) : !products || products.length === 0 ? (
        <div className="text-center py-8 bg-muted/20 rounded-lg text-muted-foreground">
          No {title.toLowerCase()} available
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};

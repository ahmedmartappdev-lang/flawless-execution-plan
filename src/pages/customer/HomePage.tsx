import React from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/customer/Header';
import { CategoryCard } from '@/components/customer/CategoryCard';
import { ProductCard } from '@/components/customer/ProductCard';
import { BottomNavigation } from '@/components/customer/BottomNavigation';
import { useCategories } from '@/hooks/useCategories';
import { useFeaturedProducts, useTrendingProducts, useProducts } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';

const HomePage: React.FC = () => {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: featuredProducts, isLoading: featuredLoading } = useFeaturedProducts();
  const { data: trendingProducts, isLoading: trendingLoading } = useTrendingProducts();
  const { data: allProducts, isLoading: productsLoading } = useProducts();

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="px-4 py-4 space-y-6">
        {/* Banner Section */}
        <motion.div 
          className="relative h-40 rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-primary/80"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 flex flex-col justify-center px-6">
            <h1 className="text-2xl font-bold text-primary-foreground mb-2">
              Groceries delivered
            </h1>
            <p className="text-primary-foreground/80 text-sm">
              in 10 minutes
            </p>
          </div>
          <div className="absolute right-4 bottom-0">
            <span className="text-6xl">🛒</span>
          </div>
        </motion.div>

        {/* Categories Section */}
        <section>
          <h2 className="font-bold text-lg mb-4 text-foreground">Shop by Category</h2>
          {categoriesLoading ? (
            <div className="grid grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-3">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <Skeleton className="h-3 w-14" />
                </div>
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No categories available yet</p>
            </div>
          )}
        </section>

        {/* Featured Products */}
        {featuredProducts && featuredProducts.length > 0 && (
          <section>
            <h2 className="font-bold text-lg mb-4 text-foreground">⭐ Featured Products</h2>
            <div className="grid grid-cols-2 gap-3">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Trending Products */}
        {trendingProducts && trendingProducts.length > 0 && (
          <section>
            <h2 className="font-bold text-lg mb-4 text-foreground">🔥 Trending Now</h2>
            <div className="grid grid-cols-2 gap-3">
              {trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* All Products */}
        <section>
          <h2 className="font-bold text-lg mb-4 text-foreground">All Products</h2>
          {productsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                  <Skeleton className="aspect-square" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : allProducts && allProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <span className="text-4xl mb-4 block">🛍️</span>
              <p className="font-medium">No products available yet</p>
              <p className="text-sm">Check back soon for new arrivals!</p>
            </div>
          )}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default HomePage;

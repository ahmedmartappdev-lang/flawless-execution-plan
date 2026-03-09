import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Store } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useCategories } from '@/hooks/useCategories';
import { useFeaturedProducts, useTrendingProducts, useSearchProducts, useProducts } from '@/hooks/useProducts';
import { useBanners } from '@/hooks/useBanners';
import { useFeaturedStores } from '@/hooks/useFeaturedStores';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { ProductCard } from '@/components/customer/ProductCard';
import { SearchResultsSection } from '@/components/customer/home/SearchResultsSection';
import { HeroBannerSlider } from '@/components/customer/home/HeroBannerSlider';
import { CategoryCards } from '@/components/customer/home/CategoryCards';
import { FeaturedStoresSection } from '@/components/customer/home/FeaturedStoresSection';
import { ProductGridSection } from '@/components/customer/home/ProductGridSection';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const { data: categories, isLoading: isCatLoading } = useCategories();
  const { data: featuredProducts, isLoading: isFeatLoading } = useFeaturedProducts();
  const { data: trendingProducts, isLoading: isTrendLoading } = useTrendingProducts();
  const { data: searchResults, isLoading: isSearchLoading } = useSearchProducts(searchQuery);
  const { data: banners } = useBanners();
  const { data: featuredStores } = useFeaturedStores();

  return (
    <CustomerLayout>
      <main className="max-w-[1280px] mx-auto">
        {searchQuery ? (
          <SearchResultsSection
            searchQuery={searchQuery}
            searchResults={searchResults}
            isLoading={isSearchLoading}
          />
        ) : (
          <>
            {/* CATEGORIES - Premium rectangular blocks */}
            <CategoryCards categories={categories} isLoading={isCatLoading} />

            {/* HERO BANNER SLIDER */}
            <HeroBannerSlider banners={banners} />

            {/* TOP PICKS - Featured Stores */}
            <FeaturedStoresSection stores={featuredStores} />

            {/* FEATURED PRODUCTS */}
            <ProductGridSection
              title="Featured Products"
              products={featuredProducts}
              isLoading={isFeatLoading}
            />

            {/* TRENDING PRODUCTS */}
            <ProductGridSection
              title="Trending Now"
              products={trendingProducts}
              isLoading={isTrendLoading}
            />
          </>
        )}
      </main>
    </CustomerLayout>
  );
};

export default HomePage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, X, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/customer/ProductCard';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { useSearchProducts, useProductSuggestions } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Use debounced query for the main grid search
  const { data: products, isLoading } = useSearchProducts(debouncedQuery);
  
  // Use debounced query for suggestions as well
  const { data: suggestions } = useProductSuggestions(debouncedQuery);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ahmed-mart-recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      
      // Save to recent searches (only if it's a "substantial" search)
      if (query.length >= 3) {
        // We do this update lazily, usually better on "submit", but this works for live search
        const currentRecent = localStorage.getItem('ahmed-mart-recent-searches');
        const parsedRecent = currentRecent ? JSON.parse(currentRecent) : [];
        if (!parsedRecent.includes(query)) {
           // We don't auto-save everything here to avoid spamming recent searches with typos
           // Logic moved to selection time effectively
        }
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query]);

  const saveToRecent = (term: string) => {
     const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
     setRecentSearches(updated);
     localStorage.setItem('ahmed-mart-recent-searches', JSON.stringify(updated));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setDebouncedQuery(suggestion); // Trigger immediate update
    saveToRecent(suggestion);
  };

  const handleRecentSearch = (search: string) => {
    setQuery(search);
    setDebouncedQuery(search);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('ahmed-mart-recent-searches');
  };

  const trendingSearches = ['Milk', 'Bread', 'Eggs', 'Rice', 'Oil', 'Sugar'];

  return (
    <CustomerLayout hideSearch>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="p-4 pb-24">
        {/* No query - show suggestions */}
        {!query && (
          <div className="space-y-6">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-foreground">Recent Searches</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="text-muted-foreground"
                  >
                    Clear
                  </Button>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((search, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRecentSearch(search)}
                      className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{search}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Trending Searches */}
            <section>
              <h2 className="font-semibold text-foreground mb-3">Trending Searches</h2>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecentSearch(search)}
                    className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full hover:bg-primary/10 transition-colors"
                  >
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <span className="text-sm text-foreground">{search}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Suggestions List (Smart Search) */}
        {query && suggestions && suggestions.length > 0 && (
          <div className="mb-6 bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex items-center gap-3 w-full p-3 hover:bg-muted transition-colors border-b last:border-0 border-border"
              >
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground font-medium">
                  {/* Highlight matching part could be added here, but simple text is fine */}
                  {suggestion}
                </span>
                <Sparkles className="w-3 h-3 text-yellow-500 ml-auto opacity-50" />
              </button>
            ))}
          </div>
        )}

        {/* Query entered - show results */}
        {query && (
          <div>
            {isLoading ? (
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
            ) : products && products.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 gap-3"
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </motion.div>
            ) : query.length >= 1 && (!suggestions || suggestions.length === 0) ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try searching for something else
                </p>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </CustomerLayout>
  );
};

export default SearchPage;

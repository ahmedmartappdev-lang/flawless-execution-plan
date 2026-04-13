import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllCategories } from '@/hooks/useCategories';

const AllCategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: allCategories, isLoading } = useAllCategories();

  // Show only top-level categories
  const rootCategories = allCategories?.filter(c => !c.parent_id) || [];

  return (
    <CustomerLayout>
      <div className="bg-white min-h-screen pb-20">
        
        {/* Header */}
        <div className="sticky top-[60px] md:top-[70px] z-30 bg-white border-b border-gray-100">
          <div className="flex items-center px-4 py-3 gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 flex-1">Shop by Category</h1>
            <button onClick={() => navigate('/search')} className="p-1.5 -mr-1.5 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories Grid (Matching Screenshot) */}
        <div className="p-4 max-w-[1200px] mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-4 gap-y-6">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <Skeleton className="w-full aspect-square rounded-2xl mb-2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-3 gap-y-6">
              {rootCategories.map((cat) => (
                <div 
                  key={cat.id} 
                  onClick={() => navigate(`/category/${cat.slug}`)}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div className="w-full aspect-square bg-[#f3f5f7] rounded-2xl flex items-center justify-center p-3 mb-2 group-hover:shadow-md transition-all duration-200 border border-gray-50/50">
                    <img 
                      src={cat.image_url || '/placeholder.svg'} 
                      alt={cat.name} 
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-center leading-tight text-gray-800 line-clamp-2 px-1">
                    {cat.name}
                  </span>
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

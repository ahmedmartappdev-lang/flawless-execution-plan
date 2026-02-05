import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';

// Hardcoded categories from the design
const CATEGORIES = [
  { name: 'Paan Corner', image: 'https://cdn-icons-png.flaticon.com/512/3050/3050239.png', slug: 'paan-corner' },
  { name: 'Dairy, Bread & Eggs', image: 'https://cdn-icons-png.flaticon.com/512/2674/2674486.png', slug: 'dairy-bread-eggs' },
  { name: 'Fruits & Vegetables', image: 'https://cdn-icons-png.flaticon.com/512/2329/2329903.png', slug: 'fruits-vegetables' },
  { name: 'Cold Drinks & Juices', image: 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png', slug: 'cold-drinks-juices' },
  { name: 'Snacks & Munchies', image: 'https://cdn-icons-png.flaticon.com/512/2553/2553691.png', slug: 'snacks-munchies' },
  { name: 'Breakfast & Instant Food', image: 'https://cdn-icons-png.flaticon.com/512/3421/3421297.png', slug: 'breakfast-instant-food' },
  { name: 'Sweet Tooth', image: 'https://cdn-icons-png.flaticon.com/512/3143/3143641.png', slug: 'sweet-tooth' },
  { name: 'Bakery & Biscuits', image: 'https://cdn-icons-png.flaticon.com/512/4231/4231189.png', slug: 'bakery-biscuits' },
  { name: 'Tea, Coffee & Milk', image: 'https://cdn-icons-png.flaticon.com/512/3504/3504827.png', slug: 'tea-coffee-milk' },
  { name: 'Atta, Rice & Dal', image: 'https://cdn-icons-png.flaticon.com/512/4145/4145970.png', slug: 'atta-rice-dal' },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryClick = (slug: string) => {
    navigate(`/category/${slug}`);
  };

  return (
    <div className="min-h-screen bg-white text-[#1f1f1f] overflow-x-hidden font-sans">
      
      {/* HEADER SECTION */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#eeeeee] px-[5%] py-3 flex items-center justify-between">
        
        {/* Left: Logo & Delivery Info */}
        <div className="flex items-center gap-10">
          <div className="text-[32px] font-black tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-[#f8cb46]">blink</span>
            <span className="text-[#0c831f]">it</span>
          </div>
          
          <div className="hidden md:block leading-[1.3] cursor-pointer">
            <div className="font-extrabold text-[14px]">Delivery in 15 minutes</div>
            <div className="text-[13px] text-[#666]">Tamil Nadu... ▾</div>
          </div>
        </div>

        {/* Middle: Search Bar */}
        <div className="flex-grow mx-4 md:mx-[60px] relative">
          <Search className="absolute left-[15px] top-[14px] text-[#888] w-4 h-4" />
          <input 
            type="text" 
            className="w-full bg-[#f8f8f8] border border-[#efefef] rounded-[10px] py-[14px] pl-[45px] pr-[14px] text-[14px] outline-none focus:border-[#0c831f] transition-colors"
            placeholder="Search 'curd'"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>

        {/* Right: Login & Cart */}
        <div className="flex items-center gap-[30px]">
          {user ? (
             <div 
               className="hidden md:flex items-center gap-2 font-semibold text-[16px] cursor-pointer hover:text-[#0c831f]"
               onClick={() => navigate('/profile')}
             >
               <User className="w-5 h-5" />
               <span className="truncate max-w-[100px]">{user.full_name || 'Profile'}</span>
             </div>
          ) : (
            <div 
              className="hidden md:block font-semibold text-[16px] cursor-pointer" 
              onClick={() => navigate('/auth')}
            >
              Login
            </div>
          )}

          <button 
            className="bg-[#0c831f] text-white px-[20px] py-[12px] rounded-[8px] font-bold border-none flex items-center gap-[10px] cursor-pointer hover:bg-[#096e1a] transition-colors"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden md:inline">My Cart</span>
            {items.length > 0 && (
              <span className="bg-white text-[#0c831f] text-xs px-1.5 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-[1280px] mx-auto px-5 my-5">
        
        {/* PROMO BANNERS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          
          {/* Pharmacy Card */}
          <div className="bg-[#eef9f1] rounded-[16px] p-6 h-[200px] flex items-center justify-between overflow-hidden relative">
            <div className="flex-1 z-10">
              <h2 className="text-[22px] font-extrabold mb-2 leading-[1.1]">Pharmacy at your doorstep!</h2>
              <p className="text-[13px] mb-[18px] text-[#444]">Cough syrups, pain relief sprays & more</p>
              <button 
                className="bg-black text-white px-[18px] py-[10px] rounded-[8px] text-[13px] font-bold border-none cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/category/pharmacy')}
              >
                Order Now
              </button>
            </div>
            <div className="flex-[0.8] h-full flex items-end justify-end">
              <img 
                src="https://cdn-icons-png.flaticon.com/512/3028/3028560.png" 
                alt="Pharmacy Items" 
                className="max-w-[120%] max-h-[140px] object-contain drop-shadow-md"
              />
            </div>
          </div>

          {/* Pet Care Card */}
          <div className="bg-[#fffce5] rounded-[16px] p-6 h-[200px] flex items-center justify-between overflow-hidden relative">
            <div className="flex-1 z-10">
              <h2 className="text-[22px] font-extrabold mb-2 leading-[1.1]">Pet care supplies at your door</h2>
              <p className="text-[13px] mb-[18px] text-[#444]">Food, treats, toys & more</p>
              <button 
                className="bg-black text-white px-[18px] py-[10px] rounded-[8px] text-[13px] font-bold border-none cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/category/pet-care')}
              >
                Order Now
              </button>
            </div>
            <div className="flex-[0.8] h-full flex items-end justify-end">
              <img 
                src="https://cdn-icons-png.flaticon.com/512/616/616408.png" 
                alt="Pet Supplies" 
                className="max-w-[120%] max-h-[140px] object-contain drop-shadow-md"
              />
            </div>
          </div>

          {/* Baby Care Card */}
          <div className="bg-[#f1f7ff] rounded-[16px] p-6 h-[200px] flex items-center justify-between overflow-hidden relative">
            <div className="flex-1 z-10">
              <h2 className="text-[22px] font-extrabold mb-2 leading-[1.1]">No time for a diaper run?</h2>
              <p className="text-[13px] mb-[18px] text-[#444]">Get baby care essentials</p>
              <button 
                className="bg-black text-white px-[18px] py-[10px] rounded-[8px] text-[13px] font-bold border-none cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/category/baby-care')}
              >
                Order Now
              </button>
            </div>
            <div className="flex-[0.8] h-full flex items-end justify-end">
              <img 
                src="https://cdn-icons-png.flaticon.com/512/2764/2764353.png" 
                alt="Baby Care" 
                className="max-w-[120%] max-h-[140px] object-contain drop-shadow-md"
              />
            </div>
          </div>

        </section>

        {/* CATEGORY GRID */}
        <section className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-[15px] mb-[50px]">
          {CATEGORIES.map((cat, index) => (
            <div 
              key={index} 
              className="text-center cursor-pointer transition-transform duration-200 hover:-translate-y-[3px]"
              onClick={() => handleCategoryClick(cat.slug)}
            >
              <div className="bg-[#f3f9fb] rounded-[12px] aspect-square mb-[10px] flex items-center justify-center p-[12px]">
                <img 
                  src={cat.image} 
                  alt={cat.name} 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[12px] font-semibold text-[#222] leading-[1.3] block">
                {cat.name}
              </span>
            </div>
          ))}
        </section>

        {/* SECTION HEADER: Dairy, Bread & Eggs */}
        <div className="flex justify-between items-center mb-[25px]">
          <h3 className="text-[24px] font-extrabold">Dairy, Bread & Eggs</h3>
          <span 
            className="text-[#0c831f] font-bold text-[16px] cursor-pointer hover:underline"
            onClick={() => handleCategoryClick('dairy-bread-eggs')}
          >
            see all
          </span>
        </div>

        {/* (Optional) Product Slider could go here, or we leave it empty as per strict design request */}
        {/* If functionality is needed, we would fetch products for this category and display them here */}
        
      </main>
    </div>
  );
};

export default HomePage;

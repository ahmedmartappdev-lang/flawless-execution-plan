import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Smartphone } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

export const Footer: React.FC = () => {
  const { data: categories } = useCategories();

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-24 md:pb-8 mt-auto w-full z-0 relative">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-1">
               <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold italic tracking-tighter -skew-x-6 text-[#1a1a1a]">
                 Ahmad<span className="text-[#ff3f6c] ml-[2px]">Mart</span>
               </h2>
            </div>
            <p className="text-gray-500 text-[15px] leading-relaxed max-w-sm">
              India's last minute app. Getting your daily needs sorted in a blink. From fresh produce to daily essentials, we deliver everything you need in 10 minutes.
            </p>
            
            <div className="space-y-3">
              <h4 className="font-bold text-gray-900 text-sm">Download App</h4>
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                  <Smartphone className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-[10px] font-medium opacity-80">Get it on</div>
                    <div className="text-xs font-bold leading-none">Google Play</div>
                  </div>
                </button>
                <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                  <Smartphone className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-[10px] font-medium opacity-80">Download on the</div>
                    <div className="text-xs font-bold leading-none">App Store</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Useful Links */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-gray-900 mb-6 text-[16px]">Useful Links</h3>
            <ul className="space-y-3 text-[14px] text-gray-500 font-medium">
              <li><Link to="/about" className="hover:text-[#0c831f] transition-colors">About Us</Link></li>
              <li><Link to="/partner" className="hover:text-[#0c831f] transition-colors">Partner with us</Link></li>
              <li><Link to="/careers" className="hover:text-[#0c831f] transition-colors">Careers</Link></li>
              <li><Link to="/blog" className="hover:text-[#0c831f] transition-colors">Blog</Link></li>
              <li><Link to="/privacy" className="hover:text-[#0c831f] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-[#0c831f] transition-colors">Terms of Service</Link></li>
              <li><Link to="/refund" className="hover:text-[#0c831f] transition-colors">Refund Policy</Link></li>
              <li><Link to="/faq" className="hover:text-[#0c831f] transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* Categories - Spans 2 columns usually */}
          <div className="lg:col-span-6">
            <h3 className="font-bold text-gray-900 mb-6 text-[16px]">Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-[14px] text-gray-500 font-medium">
              {categories?.map((cat) => (
                <Link 
                  key={cat.id} 
                  to={`/category/${cat.slug}`}
                  className="hover:text-[#0c831f] transition-colors truncate block"
                >
                  {cat.name}
                </Link>
              ))}
              
              {/* Fallback items to show design if no dynamic categories yet */}
              {(!categories || categories.length === 0) && (
                <>
                   <span className="cursor-pointer hover:text-[#0c831f]">Vegetables & Fruits</span>
                   <span className="cursor-pointer hover:text-[#0c831f]">Cold Drinks & Juices</span>
                   <span className="cursor-pointer hover:text-[#0c831f]">Bakery & Biscuits</span>
                   <span className="cursor-pointer hover:text-[#0c831f]">Dry Fruits, Masala & Oil</span>
                   <span className="cursor-pointer hover:text-[#0c831f]">Paan Corner</span>
                   <span className="cursor-pointer hover:text-[#0c831f]">Pharma & Wellness</span>
                   <span className="cursor-pointer hover:text-[#0c831f]">Ice Creams & Frozen</span>
                   <span className="cursor-pointer hover:text-[#0c831f]">Beauty & Cosmetics</span>
                   <span className="cursor-pointer hover:text-[#0c831f]">Magazines & Books</span>
                   <span className="cursor-pointer hover:text-[#0c831f]">Dairy & Breakfast</span>
                   <span className="cursor-pointer hover:text-[#0c831f]">Instant Food</span>
                   <span className="cursor-pointer hover:text-[#0c831f]">Tea, Coffee & Health</span>
                </>
              )}
              
              <Link to="/" className="text-[#0c831f] font-semibold flex items-center gap-1 mt-2 col-span-2 md:col-span-3">
                See all categories
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[13px] text-gray-400 font-medium text-center md:text-left">
            © 2024 Ahmad Mart Commerce Private Limited. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-gray-400 font-medium hidden md:inline">Follow us on</span>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#0c831f] hover:text-white hover:border-[#0c831f] transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#0c831f] hover:text-white hover:border-[#0c831f] transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#0c831f] hover:text-white hover:border-[#0c831f] transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#0c831f] hover:text-white hover:border-[#0c831f] transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
        
        {/* Legal Disclaimer often found in these apps */}
        <div className="mt-8 text-[11px] text-gray-300 leading-relaxed text-center md:text-left">
          "Ahmad Mart" is owned & managed by "Ahmad Commerce Private Limited" and is not related, linked or interconnected in whatsoever manner or nature, to other quick commerce services.
        </div>
      </div>
    </footer>
  );
};

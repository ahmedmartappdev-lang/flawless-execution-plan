import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Smartphone, MapPin, Mail, Phone } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

// CHANGED: "export const" instead of "export default" to fix the build error
export const Footer: React.FC = () => {
  const { data: categories } = useCategories();

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-24 md:pb-8 mt-auto w-full z-0 relative">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-12">
          
          {/* 1. Brand & App Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-1">
               <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold italic tracking-tighter -skew-x-6 text-[#1a1a1a]">
                 Ahmad<span className="text-[#ff3f6c] ml-[2px]">Mart</span>
               </h2>
            </div>
            <p className="text-gray-500 text-[15px] leading-relaxed max-w-sm">
              Your on-demand delivery partner. From fresh produce to daily essentials, we deliver everything you need right to your doorsteps.
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

          {/* 2. Legal & Company Links */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-gray-900 mb-6 text-[16px]">Company & Legal</h3>
            <ul className="space-y-3 text-[14px] text-gray-500 font-medium">
              <li><Link to="/about" className="hover:text-[#0c831f] transition-colors">About Us</Link></li>
              <li><Link to="/terms" className="hover:text-[#0c831f] transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-[#0c831f] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/refund-policy" className="hover:text-[#0c831f] transition-colors">Refund Policy</Link></li>
              <li><Link to="/merchant-policy" className="hover:text-[#0c831f] transition-colors">Merchant Policy</Link></li>
              <li><Link to="/vendor/register" className="hover:text-[#0c831f] transition-colors">Partner with us</Link></li>
              <li><Link to="/delivery/register" className="hover:text-[#0c831f] transition-colors">Ride with us</Link></li>
            </ul>
          </div>

          {/* 3. Categories (Dynamic) */}
          <div className="lg:col-span-3">
            <h3 className="font-bold text-gray-900 mb-6 text-[16px]">Top Categories</h3>
            <div className="flex flex-col gap-2 text-[14px] text-gray-500 font-medium">
              {categories?.slice(0, 6).map((cat) => (
                <Link 
                  key={cat.id} 
                  to={`/category/${cat.slug}`}
                  className="hover:text-[#0c831f] transition-colors truncate"
                >
                  {cat.name}
                </Link>
              ))}
              {!categories?.length && (
                 <>
                   <span className="text-gray-400">Vegetables & Fruits</span>
                   <span className="text-gray-400">Dairy & Breakfast</span>
                   <span className="text-gray-400">Cold Drinks & Juices</span>
                 </>
              )}
              <Link to="/" className="text-[#0c831f] font-semibold mt-2">
                View All Categories
              </Link>
            </div>
          </div>

          {/* 4. Contact Us (From Docs) */}
          <div className="lg:col-span-3">
            <h3 className="font-bold text-gray-900 mb-6 text-[16px]">Contact Us</h3>
            <ul className="space-y-4 text-[14px] text-gray-500 font-medium">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 text-[#0c831f] mr-3 mt-0.5 shrink-0" />
                <span>Ambur, Tamil Nadu, India</span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 text-[#0c831f] mr-3 shrink-0" />
                <a href="tel:9952488233" className="hover:text-[#0c831f]">99524 88233</a>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 text-[#0c831f] mr-3 shrink-0" />
                <a href="mailto:support@ahmadenterprises.in" className="hover:text-[#0c831f] break-all">
                  support@ahmadenterprises.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[13px] text-gray-400 font-medium text-center md:text-left">
            © {new Date().getFullYear()} Ahmad Enterprises. All rights reserved.
          </p>
          
          <div className="flex gap-3">
             <a href="#" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#0c831f] hover:text-white transition-all"><Instagram className="w-4 h-4" /></a>
             <a href="#" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#0c831f] hover:text-white transition-all"><Twitter className="w-4 h-4" /></a>
             <a href="#" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#0c831f] hover:text-white transition-all"><Facebook className="w-4 h-4" /></a>
          </div>
        </div>
        
        {/* Mandatory Legal Disclaimer (Clauses from Docs) */}
        <div className="mt-6 pt-6 border-t border-gray-50 text-[11px] text-gray-400 leading-relaxed text-center md:text-justify bg-gray-50 p-4 rounded-lg">
          <p className="mb-2">
            <strong>Disclaimer:</strong> "Ahmad Mart" is a trade mark of "Ahmad Enterprises". 
            Ahmad Mart is an e-Commerce service that delivers from restaurants, retail, and wholesale stores.
          </p>
          <p>
            By using this application, you acknowledge that Ahmad Mart is responsible only for ordering and delivery services. 
            <strong> Liability Clause:</strong> If any harm is caused to the customer after consuming food or products, the respective Restaurant/Retail/Wholesale Store 
            will be responsible for the same, not Ahmad Mart. Cancellations are generally not entertained after order placement with the store.
          </p>
        </div>
      </div>
    </footer>
  );
};

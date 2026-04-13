import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

export const AppInstallBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  // If the user clicks the 'X', it hides the banner
  if (!isVisible) return null;

  return (
    <div className="md:hidden flex items-center justify-between bg-white px-3 py-2.5 border-b border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] w-full">
      <div className="flex items-center gap-2.5">
        
        {/* Close Button */}
        <button 
          onClick={() => setIsVisible(false)} 
          className="text-gray-400 p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* App Logo */}
        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-sm border border-gray-100">
          <img src="/logo.jpeg" alt="Ahmad Mart" className="w-full h-full object-cover" />
        </div>
        
        {/* App Info */}
        <div className="flex flex-col justify-center">
          <h3 className="text-[13px] font-extrabold text-gray-900 leading-tight">Ahmad Mart</h3>
          <p className="text-[11px] font-medium text-gray-500 leading-tight mt-[2px]">10 Minutes Delivery</p>
          <div className="flex items-center gap-1 mt-[2px]">
            <Star className="w-3 h-3 fill-[#ffc107] text-[#ffc107]" />
            <span className="text-[10px] font-bold text-gray-700 mt-[1px]">4.9</span>
          </div>
        </div>

      </div>
      
      {/* Use App Button */}
      <button className="bg-[#2e7d32] text-white text-[12px] font-bold px-4 py-1.5 rounded-full shadow-sm hover:bg-green-800 transition-colors active:scale-95">
        Use App
      </button>
    </div>
  );
};

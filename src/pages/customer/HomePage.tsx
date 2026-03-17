import React from 'react';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';

const HomePage: React.FC = () => {
  return (
    <CustomerLayout>
      <div className="space-y-6 bg-surface min-h-screen pb-24 font-sans">
        {/* BEGIN: HeroCarousel */}
        <section className="px-4 pt-4">
          <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 pb-2">
            {/* Slide 1 */}
            <div className="min-w-[85vw] snap-center bg-dark rounded-premium p-6 text-white flex flex-col justify-between h-44 relative overflow-hidden">
              <div className="z-10">
                <h3 className="text-xl font-bold leading-tight tracking-tight">Shop Now.<br />Pay Later.</h3>
                <p className="text-xs text-white/70 mt-1">With Ahmad Credit Card</p>
              </div>
              <button className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-full w-max z-10">Apply Now</button>
              <div className="absolute -right-4 -bottom-4 w-32 h-20 bg-primary/20 rounded-lg rotate-12 border border-white/10"></div>
              <div className="absolute -right-2 -bottom-2 w-32 h-20 bg-primary/40 rounded-lg rotate-6 border border-white/20"></div>
            </div>
            {/* Slide 2 */}
            <div className="min-w-[85vw] snap-center bg-secondary/10 border border-secondary/20 rounded-premium p-6 flex flex-col justify-between h-44 relative overflow-hidden">
              <div className="z-10">
                <h3 className="text-xl font-bold leading-tight text-dark tracking-tight">Fresh Produce,<br />Delivered Daily</h3>
                <p className="text-xs text-muted mt-1">Direct from local farms</p>
              </div>
              <button className="bg-secondary text-white text-xs font-bold px-5 py-2.5 rounded-full w-max z-10">Shop Fresh</button>
              <img alt="Fresh Vegetables" className="absolute -right-4 -bottom-4 w-36 h-36 object-cover opacity-80" src="/placeholder.svg" />
            </div>
          </div>
        </section>

        {/* BEGIN: CreditStrip */}
        <section className="px-4">
          <div className="bg-white p-4 rounded-premium border border-gray-100 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-textMain">Ahmad Credit Card Active</h4>
                <p className="text-xs text-primary font-semibold">Available Credit: Rs. 2,000</p>
              </div>
            </div>
            <button className="text-xs font-bold text-white bg-primary px-4 py-2 rounded-full">Use Now</button>
          </div>
        </section>

        {/* BEGIN: CategoryPills */}
        <section className="px-4">
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            <button className="px-6 py-2 bg-primary text-white rounded-full text-sm font-semibold whitespace-nowrap shadow-sm">Dairy</button>
            <button className="px-6 py-2 bg-white text-muted border border-gray-100 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm">Fruits</button>
            <button className="px-6 py-2 bg-white text-muted border border-gray-100 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm">Vegetables</button>
            <button className="px-6 py-2 bg-white text-muted border border-gray-100 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm">Meat</button>
            <button className="px-6 py-2 bg-white text-muted border border-gray-100 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm">Beverages</button>
            <button className="px-6 py-2 bg-white text-muted border border-gray-100 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm">Snacks</button>
          </div>
        </section>

        {/* BEGIN: TodaysOffers */}
        <section className="pl-4">
          <div className="flex items-center justify-between pr-4 mb-4">
            <h3 className="text-lg font-bold text-textMain tracking-tight">Today's Offers</h3>
            <button className="text-sm font-semibold text-primary">View All</button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {/* Product Card 1 */}
            <div className="min-w-[160px] bg-white rounded-premium p-3 border border-gray-100 relative shadow-sm">
              <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">20% OFF</span>
              <div className="h-28 w-full mb-3 flex items-center justify-center">
                <img alt="Product" className="max-h-full object-contain" src="/placeholder.svg" />
              </div>
              <h4 className="text-xs font-bold text-textMain line-clamp-1">Fresh Milk Gold</h4>
              <p className="text-[10px] text-muted mb-2">500 ml</p>
              <div className="flex items-center justify-between mt-auto">
                <div>
                  <p className="text-sm font-bold text-primary">₹32</p>
                  <p className="text-[10px] text-muted line-through">₹40</p>
                </div>
                <button className="bg-surface text-primary border border-primary/20 text-[10px] font-bold px-3 py-1.5 rounded-lg">+ Add</button>
              </div>
            </div>
            {/* Product Card 2 */}
            <div className="min-w-[160px] bg-white rounded-premium p-3 border border-gray-100 relative shadow-sm">
              <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">15% OFF</span>
              <div className="h-28 w-full mb-3 flex items-center justify-center">
                <img alt="Product" className="max-h-full object-contain" src="/placeholder.svg" />
              </div>
              <h4 className="text-xs font-bold text-textMain line-clamp-1">Ambur Farm Eggs</h4>
              <p className="text-[10px] text-muted mb-2">6 units</p>
              <div className="flex items-center justify-between mt-auto">
                <div>
                  <p className="text-sm font-bold text-primary">₹48</p>
                  <p className="text-[10px] text-muted line-through">₹60</p>
                </div>
                <button className="bg-surface text-primary border border-primary/20 text-[10px] font-bold px-3 py-1.5 rounded-lg">+ Add</button>
              </div>
            </div>
            {/* Product Card 3 */}
            <div className="min-w-[160px] bg-white rounded-premium p-3 border border-gray-100 relative shadow-sm">
              <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">10% OFF</span>
              <div className="h-28 w-full mb-3 flex items-center justify-center">
                <img alt="Product" className="max-h-full object-contain" src="/placeholder.svg" />
              </div>
              <h4 className="text-xs font-bold text-textMain line-clamp-1">Sunfeast Dark Fantasy</h4>
              <p className="text-[10px] text-muted mb-2">150g</p>
              <div className="flex items-center justify-between mt-auto">
                <div>
                  <p className="text-sm font-bold text-primary">₹45</p>
                  <p className="text-[10px] text-muted line-through">₹50</p>
                </div>
                <button className="bg-surface text-primary border border-primary/20 text-[10px] font-bold px-3 py-1.5 rounded-lg">+ Add</button>
              </div>
            </div>
          </div>
        </section>

        {/* BEGIN: ShopByCategory */}
        <section className="px-4">
          <h3 className="text-lg font-bold text-textMain mb-4 tracking-tight">Shop by Category</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#E9F5E6] p-4 rounded-premium h-36 flex flex-col justify-between relative overflow-hidden">
              <div>
                <h4 className="text-sm font-bold text-dark leading-tight">Fruits &<br />Vegetables</h4>
                <p className="text-[10px] text-secondary font-medium">120+ items</p>
              </div>
            </div>
            <div className="bg-[#FEF3E2] p-4 rounded-premium h-36 flex flex-col justify-between relative overflow-hidden">
              <div>
                <h4 className="text-sm font-bold text-dark leading-tight">Dairy &<br />Eggs</h4>
                <p className="text-[10px] text-[#D97706] font-medium">80+ items</p>
              </div>
            </div>
            <div className="bg-[#FEE2E2] p-4 rounded-premium h-36 flex flex-col justify-between relative overflow-hidden">
              <div>
                <h4 className="text-sm font-bold text-dark leading-tight">Beverages</h4>
                <p className="text-[10px] text-[#DC2626] font-medium">200+ items</p>
              </div>
            </div>
            <div className="bg-dark p-4 rounded-premium h-36 flex flex-col justify-between relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="text-sm font-bold text-white leading-tight">Snacks</h4>
                <p className="text-[10px] text-white/90 font-medium">150+ items</p>
              </div>
            </div>
          </div>
        </section>

        {/* BEGIN: CreditCardFeature */}
        <section className="px-4">
          <div className="bg-dark rounded-premium p-6 text-white shadow-lg">
            <h3 className="text-lg font-bold mb-6 tracking-tight">Introducing Ahmad Credit Card</h3>
            <div className="space-y-5 mb-8">
              {['Buy now, pay at month end', 'Zero interest', 'Accepted only at Ahmad Mart'].map((feature, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-white/90">{feature}</p>
                </div>
              ))}
            </div>
            <button className="w-full bg-primary hover:bg-secondary transition-colors text-white font-bold py-4 rounded-premium text-sm">Activate Your Card</button>
          </div>
        </section>

        {/* BEGIN: OrderAgain */}
        <section className="pl-4">
          <h3 className="text-lg font-bold text-textMain mb-4 tracking-tight">Order Again</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="min-w-[130px] flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                <img alt="Item" className="w-10 h-10 object-contain" src="/placeholder.svg" />
                <div className="flex-1">
                  <p className="text-[10px] font-bold line-clamp-1">Fresh Item</p>
                  <p className="text-[10px] text-primary font-bold">₹25</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BEGIN: TrustFooter */}
        <footer className="px-4 py-8 text-center bg-transparent">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">100% Fresh</span>
            <span className="text-muted text-[10px]">•</span>
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Local Delivery</span>
            <span className="text-muted text-[10px]">•</span>
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Ambur's Own Store</span>
          </div>
          <p className="text-xs text-muted/60 font-medium">© 2024 Ahmad Mart Hyperlocal Services</p>
        </footer>
      </div>
    </CustomerLayout>
  );
};

export default HomePage;

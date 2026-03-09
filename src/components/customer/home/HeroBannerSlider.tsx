import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface Banner {
  id: string;
  image_url: string;
  title?: string | null;
  link_url?: string | null;
}

interface HeroBannerSliderProps {
  banners?: Banner[] | null;
}

export const HeroBannerSlider: React.FC<HeroBannerSliderProps> = ({ banners }) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = banners && banners.length > 0 ? banners : null;
  const slideCount = slides ? slides.length : 1;

  const nextSlide = useCallback(() => {
    if (slideCount > 1) {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }
  }, [slideCount]);

  useEffect(() => {
    if (slideCount <= 1) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [nextSlide, slideCount]);

  return (
    <section className="px-4 pt-4 pb-2">
      <div className="relative rounded-2xl overflow-hidden shadow-md">
        {slides ? (
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((banner) => (
              <img
                key={banner.id}
                src={banner.image_url}
                alt={banner.title || 'Promo banner'}
                className="w-full flex-shrink-0 h-[160px] md:h-[280px] object-cover cursor-pointer"
                onClick={() => banner.link_url && navigate(banner.link_url)}
              />
            ))}
          </div>
        ) : (
          <img
            src="/banner.jpg"
            alt="Welcome to AhmadMart"
            className="w-full h-[160px] md:h-[280px] object-cover"
          />
        )}
      </div>

      {/* Dots indicator */}
      {slideCount > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {Array.from({ length: slideCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? 'w-4 bg-primary'
                  : 'w-2 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

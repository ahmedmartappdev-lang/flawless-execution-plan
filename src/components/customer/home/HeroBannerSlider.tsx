import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface Banner {
  id: string;
  image_url: string;
  title?: string | null;
  link_url?: string | null;
  display_order?: number;
}

interface HeroBannerSliderProps {
  banners?: Banner[] | null;
}

export const HeroBannerSlider: React.FC<HeroBannerSliderProps> = ({ banners }) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Sort by display_order to ensure correct ordering
  const slides = banners && banners.length > 0
    ? [...banners].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    : null;
  const slideCount = slides ? slides.length : 1;

  const nextSlide = useCallback(() => {
    if (slideCount > 1) {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }
  }, [slideCount]);

  const prevSlide = useCallback(() => {
    if (slideCount > 1) {
      setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount);
    }
  }, [slideCount]);

  useEffect(() => {
    if (slideCount <= 1) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [nextSlide, slideCount]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold) {
      nextSlide();
    } else if (diff < -threshold) {
      prevSlide();
    }
  };

  return (
    <section className="px-4 pt-4 pb-2">
      <div
        className="relative rounded-2xl overflow-hidden shadow-md"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
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
                className="w-full min-w-full flex-shrink-0 h-[160px] md:h-[280px] object-cover cursor-pointer"
                onClick={() => banner.link_url && navigate(banner.link_url)}
                draggable={false}
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

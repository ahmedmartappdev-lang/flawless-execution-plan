import React from 'react';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { useVendorReviews } from '@/hooks/useVendorCatalog';
import { useAuthStore } from '@/stores/authStore';

/**
 * Customer-facing rating summary on the store page.
 *
 * Per the client's policy, individual review comments are visible only to
 * the admin (in /admin/reviews). Customers see:
 *   - the store's aggregate rating and how many customers rated it, and
 *   - their OWN review (stars + comment), so they can see what they rated.
 * Other customers' reviews are never listed here.
 */
export const VendorReviewsSection: React.FC<{
  vendorId: string;
  vendorRating?: number | null;
}> = ({ vendorId, vendorRating }) => {
  const { data: reviews, isLoading } = useVendorReviews(vendorId, 50);
  const { user } = useAuthStore();

  if (isLoading || !reviews || reviews.length === 0) return null;

  const avg =
    typeof vendorRating === 'number' && vendorRating > 0
      ? vendorRating
      : reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const own = user?.id ? reviews.find(r => r.customer_id === user.id) : undefined;

  return (
    <section className="bg-white px-4 py-6 border-t border-gray-100">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-foreground tracking-tight">
            Customer rating
          </h3>
          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-gray-900">{avg.toFixed(1)}</span>
            <span className="text-gray-500">
              ({reviews.length} rating{reviews.length === 1 ? '' : 's'})
            </span>
          </span>
        </div>

        {own && (
          <article className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <header className="flex items-center justify-between gap-3 mb-1">
              <span className="text-sm font-semibold text-gray-900">Your review</span>
              <div className="flex items-center gap-0.5 shrink-0">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= own.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </header>
            {own.comment && (
              <p className="text-sm text-gray-700 leading-snug">{own.comment}</p>
            )}
            <p className="text-[11px] text-gray-400 mt-1">
              {format(new Date(own.created_at), 'd MMM yyyy')}
            </p>
          </article>
        )}
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useVendorReviews } from '@/hooks/useVendorCatalog';

/**
 * Customer-facing list of vendor reviews on the store page.
 * Shows top N (collapsed); "View all" expands the rest. Quiet when
 * there are no reviews — no empty-state taking up space.
 */
export const VendorReviewsSection: React.FC<{
  vendorId: string;
  vendorRating?: number | null;
}> = ({ vendorId, vendorRating }) => {
  const { data: reviews, isLoading } = useVendorReviews(vendorId, 50);
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? (reviews || []) : (reviews || []).slice(0, 5);

  if (isLoading) {
    return (
      <section className="bg-white px-4 py-6 border-t border-gray-100">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-gray-100 p-3">
                <Skeleton className="h-3 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="bg-white px-4 py-6 border-t border-gray-100">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-foreground tracking-tight">
            Customer reviews
          </h3>
          {typeof vendorRating === 'number' && vendorRating > 0 && (
            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-gray-900">{vendorRating.toFixed(1)}</span>
              <span className="text-gray-500">({reviews.length})</span>
            </span>
          )}
        </div>

        <div className="space-y-3">
          {visible.map(r => (
            <article
              key={r.id}
              className="rounded-xl border border-gray-100 bg-white p-3"
            >
              <header className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                    {(r.reviewer_name?.[0] || '?').toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {r.reviewer_name || 'Verified customer'}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= r.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </header>
              {r.comment && (
                <p className="text-sm text-gray-700 leading-snug">
                  {r.comment}
                </p>
              )}
              <p className="text-[11px] text-gray-400 mt-1">
                {format(new Date(r.created_at), 'd MMM yyyy')}
              </p>
            </article>
          ))}
        </div>

        {reviews.length > 5 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-4 text-sm font-semibold text-primary"
          >
            {expanded ? 'Show less' : `View all ${reviews.length} reviews`}
          </button>
        )}
      </div>
    </section>
  );
};

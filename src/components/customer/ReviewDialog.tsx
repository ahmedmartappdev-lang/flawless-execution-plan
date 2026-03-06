import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
}

const StarRating: React.FC<{
  value: number;
  onChange: (v: number) => void;
  label: string;
}> = ({ value, onChange, label }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium">{label}</span>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-0.5"
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-300'
            }`}
          />
        </button>
      ))}
    </div>
  </div>
);

export const ReviewDialog: React.FC<ReviewDialogProps> = ({
  open,
  onOpenChange,
  order,
}) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [overallRating, setOverallRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState('');

  // Check if already reviewed
  const { data: existingReviews } = useQuery({
    queryKey: ['order-reviews', order?.id],
    queryFn: async () => {
      if (!order?.id) return [];
      const { data } = await supabase
        .from('reviews' as any)
        .select('*')
        .eq('order_id', order.id);
      return data || [];
    },
    enabled: !!order?.id && open,
  });

  const hasReviewed = existingReviews && existingReviews.length > 0;

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user || !order) throw new Error('Missing data');

      const reviews: any[] = [];

      if (overallRating > 0) {
        reviews.push({
          order_id: order.id,
          customer_id: user.id,
          review_type: 'overall',
          rating: overallRating,
          comment: comment || null,
          product_id: null,
          delivery_partner_id: null,
        });
      }

      if (deliveryRating > 0 && order.delivery_partner_id) {
        reviews.push({
          order_id: order.id,
          customer_id: user.id,
          review_type: 'delivery',
          rating: deliveryRating,
          comment: null,
          product_id: null,
          delivery_partner_id: order.delivery_partner_id,
        });
      }

      if (reviews.length === 0) throw new Error('Please provide at least one rating');

      const { error } = await supabase
        .from('reviews' as any)
        .insert(reviews);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-reviews', order?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Thank you for your review!');
      onOpenChange(false);
      setOverallRating(0);
      setDeliveryRating(0);
      setComment('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
        </DialogHeader>

        {hasReviewed ? (
          <div className="text-center py-6">
            <Star className="w-12 h-12 mx-auto mb-3 fill-yellow-400 text-yellow-400" />
            <p className="font-medium">You've already reviewed this order</p>
            <p className="text-sm text-muted-foreground mt-1">Thanks for your feedback!</p>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            <div className="text-xs text-muted-foreground">
              Order #{order.order_number}
            </div>

            <div className="space-y-4">
              <StarRating
                label="Overall Experience"
                value={overallRating}
                onChange={setOverallRating}
              />

              {order.delivery_partner_id && (
                <StarRating
                  label="Delivery Partner"
                  value={deliveryRating}
                  onChange={setDeliveryRating}
                />
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Comments (optional)
              </label>
              <Textarea
                placeholder="Tell us about your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              className="w-full"
              onClick={() => submitReview.mutate()}
              disabled={submitReview.isPending || (overallRating === 0 && deliveryRating === 0)}
            >
              {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

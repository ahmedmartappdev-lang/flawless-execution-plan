import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { enablePush, disablePush, getPushStatus, type PushStatus } from '@/lib/pushNotifications';
import { useAuthStore } from '@/stores/authStore';

const DISMISS_KEY = 'ahmadmart:push-prompt-dismissed';

/**
 * Small dismissible card that asks the logged-in customer to turn on
 * push notifications. Silently hides if:
 *   - user is not logged in
 *   - browser doesn't support push (Safari desktop, iOS < 16.4)
 *   - user already granted permission AND is subscribed
 *   - user permanently dismissed the card
 *
 * Placed on ProfilePage so the customer only sees it after signing in.
 */
export const EnableNotificationsCard: React.FC = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return window.localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    let alive = true;
    getPushStatus().then((s) => { if (alive) setStatus(s); });
    return () => { alive = false; };
  }, []);

  if (!user) return null;
  if (!status) return null;
  if (!status.supported) return null;
  if (dismissed) return null;
  if (status.permission === 'granted' && status.subscribed) return null;

  const handleEnable = async () => {
    setBusy(true);
    try {
      const result = await enablePush();
      if (result.ok) {
        toast({ title: 'Notifications enabled', description: 'You will get order updates on this device.' });
        setStatus(await getPushStatus());
      } else if (result.reason === 'blocked') {
        toast({
          title: 'Notifications are blocked',
          description: "Turn them on in your browser's site settings for ahmadmart.in, then try again.",
          variant: 'destructive',
        });
      } else if (result.reason === 'denied') {
        toast({ title: 'Permission denied', description: 'You can enable it later from this card.', variant: 'destructive' });
      } else {
        toast({
          title: 'Could not enable notifications',
          description: result.detail || 'Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = () => {
    try { window.localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm mb-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-full bg-white border border-emerald-100 p-2">
          {status.subscribed ? <BellOff className="w-5 h-5 text-emerald-700" /> : <Bell className="w-5 h-5 text-emerald-700" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">Get order updates on your phone</p>
          <p className="text-[13px] text-slate-600 mt-0.5 leading-snug">
            We{"'"}ll notify you when your order is confirmed, on the way, or delivered — even when the app is closed.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={busy}
              className="h-9 rounded-full font-semibold"
            >
              {busy && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              Enable notifications
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              disabled={busy}
              className="h-9 rounded-full text-slate-600"
            >
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnableNotificationsCard;

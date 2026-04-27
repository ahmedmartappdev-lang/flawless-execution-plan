import React, { useState } from 'react';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, CreditCard, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCustomerCredits } from '@/hooks/useCustomerCredits';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

const CreditHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { creditLimit, dueAmount, availableCredit, creditHistory, isLoading } = useCustomerCredits();
  const usagePercent = creditLimit > 0 ? (dueAmount / creditLimit) * 100 : 0;
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const handlePayDues = async () => {
    if (!user) { toast.error('Please login'); return; }
    const amt = Number(payAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (amt > dueAmount) { toast.error('Cannot pay more than your due amount'); return; }

    setPaying(true);
    try {
      const { openRazorpay, loadRazorpayScript } = await import('@/lib/razorpay');
      await loadRazorpayScript();

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('Session expired. Please login again.');

      const SUPABASE_URL = (supabase as any).supabaseUrl || 'https://otksdfphbgneusgjvjzg.supabase.co';
      const SUPABASE_KEY = (supabase as any).supabaseKey;

      // 1. Init
      const initRes = await fetch(`${SUPABASE_URL}/functions/v1/pay-credit-dues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: amt }),
      });
      const initText = await initRes.text();
      if (!initRes.ok) throw new Error(`[${initRes.status}] ${initText}`);
      const init = JSON.parse(initText);

      // 2. Razorpay modal
      const rzpResp = await openRazorpay({
        key: init.key_id,
        amount: init.amount,
        currency: init.currency,
        order_id: init.razorpay_order_id,
        name: 'Ahmad Mart',
        description: `Credit dues payment ₹${amt}`,
        prefill: {
          name: init.prefill_name || undefined,
          contact: init.prefill_contact || undefined,
        },
        theme: { color: '#16a34a' },
      });

      // 3. Verify on server
      const verifyRes = await fetch(`${SUPABASE_URL}/functions/v1/verify-credit-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rzpResp),
      });
      const verifyText = await verifyRes.text();
      if (!verifyRes.ok) throw new Error(`[${verifyRes.status}] ${verifyText}`);

      toast.success(`Paid ₹${amt} towards your credit dues`);
      setPayOpen(false);
      setPayAmount('');
      queryClient.invalidateQueries({ queryKey: ['customer-credit-balance', user.id] });
      queryClient.invalidateQueries({ queryKey: ['customer-credit-history', user.id] });
    } catch (e: any) {
      if (e?.message === 'PAYMENT_CANCELLED') toast.error('Payment cancelled');
      else if (e?.message === 'PAYMENT_FAILED') toast.error('Payment failed. Please try again.');
      else toast.error(e?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const openPayDialog = () => {
    setPayAmount(String(Math.round(dueAmount * 100) / 100));
    setPayOpen(true);
  };

  return (
    <CustomerLayout>
      <div className="max-w-[800px] mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Credit History</h1>
        </div>

        {/* Credit Card Summary */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Credit Limit</p>
                <p className="text-xl font-bold mt-1">₹{creditLimit.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Due Amount</p>
                <p className={`text-xl font-bold mt-1 ${dueAmount > 0 ? 'text-destructive' : ''}`}>
                  ₹{dueAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Available</p>
                <p className="text-xl font-bold mt-1 text-green-600">₹{availableCredit.toLocaleString()}</p>
              </div>
            </div>
            {creditLimit > 0 && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Used: ₹{dueAmount.toLocaleString()}</span>
                  <span>{usagePercent.toFixed(0)}%</span>
                </div>
                <Progress value={Math.min(usagePercent, 100)} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pay Dues + Apply for Credit CTAs */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {dueAmount > 0 && (
            <Button
              className="w-full h-12 rounded-2xl shadow-sm"
              onClick={openPayDialog}
              disabled={paying}
            >
              {paying ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</>
              ) : (
                <>Pay ₹{dueAmount.toLocaleString()} dues online</>
              )}
            </Button>
          )}
          <Button variant="outline" className="w-full h-12 rounded-2xl" onClick={() => navigate('/credit-apply')}>
            <CreditCard className="w-4 h-4 mr-2" />
            Apply for Credit Limit
          </Button>
        </div>

        {/* Pay Dues amount dialog */}
        <Dialog open={payOpen} onOpenChange={(o) => { if (!paying) { setPayOpen(o); if (!o) setPayAmount(''); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pay your credit dues</DialogTitle>
              <DialogDescription>
                Pay online via UPI, card, or netbanking. Your credit balance updates instantly after payment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Outstanding due</span>
                <span className="text-base font-bold text-destructive">₹{dueAmount.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay-amount">Amount to pay</Label>
                <Input
                  id="pay-amount"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={dueAmount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="Enter amount"
                  disabled={paying}
                />
                <div className="flex gap-2 pt-1">
                  <Button type="button" size="sm" variant="outline" className="flex-1 rounded-full" onClick={() => setPayAmount(String(Math.round(dueAmount)))} disabled={paying}>
                    Pay Full ₹{Math.round(dueAmount).toLocaleString()}
                  </Button>
                  {dueAmount > 100 && (
                    <Button type="button" size="sm" variant="outline" className="flex-1 rounded-full" onClick={() => setPayAmount(String(Math.round(dueAmount / 2)))} disabled={paying}>
                      Half
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayOpen(false)} disabled={paying}>Cancel</Button>
              <Button onClick={handlePayDues} disabled={paying || !payAmount || Number(payAmount) <= 0 || Number(payAmount) > dueAmount}>
                {paying ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</>) : 'Pay Now'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : creditHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
            ) : (
              <div className="space-y-3">
                {creditHistory.map((txn: any) => {
                  const isCredit = txn.transaction_type === 'credit' || txn.transaction_type === 'refund';
                  return (
                    <div key={txn.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCredit ? 'bg-green-100' : 'bg-red-100'}`}>
                          {isCredit ? (
                            <ArrowUpRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{txn.description || txn.transaction_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(txn.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                          {isCredit ? '+' : '-'}₹{Number(txn.amount).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Due: ₹{Number(txn.balance_after).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
};

export default CreditHistoryPage;

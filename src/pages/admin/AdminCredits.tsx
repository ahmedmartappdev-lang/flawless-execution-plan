import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, Search, CreditCard } from 'lucide-react';
import { DashboardLayout, adminNavItems } from '@/components/layouts/DashboardLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';

const AdminCredits: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showAllocateDialog, setShowAllocateDialog] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [txnType, setTxnType] = useState<'credit' | 'debit'>('credit');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnDescription, setTxnDescription] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Fetch all delivery partners with their credit balance
  const { data: partners, isLoading: partnersLoading } = useQuery({
    queryKey: ['admin-delivery-partners-credits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_partners')
        .select('id, full_name, phone, credit_balance, status, total_deliveries')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch recent credit transactions
  const { data: transactions } = useQuery({
    queryKey: ['admin-credit-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*, delivery_partners:delivery_partner_id(full_name), orders:order_id(order_number)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch pending bills count
  const { data: pendingBills } = useQuery({
    queryKey: ['admin-pending-bills-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('delivery_bills')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count || 0;
    },
  });

  // Allocate credit mutation
  const allocateMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(txnAmount);
      if (!amount || amount <= 0) throw new Error('Invalid amount');
      if (!selectedPartnerId) throw new Error('Select a delivery partner');

      const partner = partners?.find(p => p.id === selectedPartnerId);
      if (!partner) throw new Error('Partner not found');

      const newBalance = txnType === 'credit'
        ? Number(partner.credit_balance) + amount
        : Number(partner.credit_balance) - amount;

      // Insert transaction record
      const { error: txnError } = await supabase
        .from('credit_transactions')
        .insert({
          delivery_partner_id: selectedPartnerId,
          transaction_type: txnType,
          amount,
          balance_after: newBalance,
          description: txnDescription || `${txnType === 'credit' ? 'Credit' : 'Debit'} by admin`,
          created_by: user?.id,
          order_id: selectedOrderId || null,
        });
      if (txnError) throw txnError;

      // Update partner's credit balance
      const { error: updateError } = await supabase
        .from('delivery_partners')
        .update({ credit_balance: newBalance })
        .eq('id', selectedPartnerId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-partners-credits'] });
      queryClient.invalidateQueries({ queryKey: ['admin-credit-transactions'] });
      toast({ title: `${txnType === 'credit' ? 'Credit' : 'Debit'} allocated successfully` });
      resetDialog();
    },
    onError: (err: any) => {
      toast({ title: err.message || 'Failed to allocate credit', variant: 'destructive' });
    },
  });

  const resetDialog = () => {
    setShowAllocateDialog(false);
    setSelectedPartnerId('');
    setTxnType('credit');
    setTxnAmount('');
    setTxnDescription('');
    setSelectedOrderId('');
  };

  const totalCreditsOut = partners?.reduce((s, p) => s + Number(p.credit_balance), 0) || 0;
  const filteredPartners = partners?.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  ) || [];

  return (
    <DashboardLayout title="Credit Management" navItems={adminNavItems} roleColor="bg-red-500 text-white" roleName="Admin Panel">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Total Credits Outstanding"
          value={`₹${totalCreditsOut.toLocaleString()}`}
          icon={Wallet}
          iconColor="bg-primary/10 text-primary"
        />
        <StatsCard
          title="Partners with Balance"
          value={partners?.filter(p => Number(p.credit_balance) > 0).length || 0}
          icon={CreditCard}
          iconColor="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Pending Bills"
          value={pendingBills || 0}
          icon={ArrowDownRight}
          iconColor="bg-yellow-100 text-yellow-600"
        />
      </div>

      <Tabs defaultValue="partners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="partners">Partner Balances</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>

        {/* Partner Balances Tab */}
        <TabsContent value="partners">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle>Delivery Partner Credits</CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search partner..."
                      className="pl-9 w-full sm:w-[200px]"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => setShowAllocateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Allocate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {partnersLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredPartners.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No delivery partners found</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Deliveries</TableHead>
                        <TableHead className="text-right">Credit Balance</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartners.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell className="font-medium">{partner.full_name || 'Unnamed'}</TableCell>
                          <TableCell>{partner.phone || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={
                              partner.status === 'available' ? 'bg-green-100 text-green-800' :
                              partner.status === 'busy' ? 'bg-blue-100 text-blue-800' :
                              'bg-muted text-muted-foreground'
                            }>
                              {partner.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{partner.total_deliveries}</TableCell>
                          <TableCell className="text-right font-bold">
                            <span className={Number(partner.credit_balance) > 0 ? 'text-green-600' : Number(partner.credit_balance) < 0 ? 'text-red-600' : ''}>
                              ₹{Number(partner.credit_balance).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPartnerId(partner.id);
                                setShowAllocateDialog(true);
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Credit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction History Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {!transactions?.length ? (
                <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Balance After</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((txn) => {
                        const isCredit = txn.transaction_type === 'credit' || txn.transaction_type === 'refund';
                        return (
                          <TableRow key={txn.id}>
                            <TableCell className="text-sm">{format(new Date(txn.created_at), 'dd MMM, hh:mm a')}</TableCell>
                            <TableCell className="font-medium">{(txn.delivery_partners as any)?.full_name || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={isCredit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                <span className="flex items-center gap-1">
                                  {isCredit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                  {txn.transaction_type}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>{(txn.orders as any)?.order_number || '-'}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{txn.description || '-'}</TableCell>
                            <TableCell className={`text-right font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                              {isCredit ? '+' : '-'}₹{Number(txn.amount).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">₹{Number(txn.balance_after).toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Allocate Credit Dialog */}
      <Dialog open={showAllocateDialog} onOpenChange={(open) => { if (!open) resetDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Credit / Debit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Delivery Partner</label>
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select partner" />
                </SelectTrigger>
                <SelectContent>
                  {partners?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name || 'Unnamed'} — ₹{Number(p.credit_balance).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Transaction Type</label>
              <Select value={txnType} onValueChange={(v) => setTxnType(v as 'credit' | 'debit')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit (Add Balance)</SelectItem>
                  <SelectItem value="debit">Debit (Deduct Balance)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Amount (₹)</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={txnAmount}
                onChange={(e) => setTxnAmount(e.target.value)}
                min="1"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea
                placeholder="Reason for credit/debit..."
                value={txnDescription}
                onChange={(e) => setTxnDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetDialog}>Cancel</Button>
            <Button
              onClick={() => allocateMutation.mutate()}
              disabled={allocateMutation.isPending || !selectedPartnerId || !txnAmount}
            >
              {allocateMutation.isPending ? 'Processing...' : `${txnType === 'credit' ? 'Add Credit' : 'Deduct'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminCredits;

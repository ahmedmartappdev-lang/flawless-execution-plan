import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, Plus, Search } from 'lucide-react';
import { DashboardLayout, adminNavItems } from '@/components/layouts/DashboardLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';

const AdminCredits: React.FC = () => {
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerCreditDialog, setShowCustomerCreditDialog] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerCreditAmount, setCustomerCreditAmount] = useState('');
  const [customerCreditType, setCustomerCreditType] = useState<'credit' | 'debit'>('credit');
  const [customerCreditDescription, setCustomerCreditDescription] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Fetch customers with credit balances
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['admin-customer-credits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, phone, credit_balance')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  // Allocate customer credit mutation
  const allocateCustomerCreditMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(customerCreditAmount);
      if (!amount || amount <= 0) throw new Error('Invalid amount');
      if (!selectedCustomerId) throw new Error('Select a customer');

      const customer = customers?.find(c => c.user_id === selectedCustomerId);
      if (!customer) throw new Error('Customer not found');

      const currentBalance = Number(customer.credit_balance || 0);
      const newBalance = customerCreditType === 'credit'
        ? currentBalance + amount
        : currentBalance - amount;

      // Update profile balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credit_balance: newBalance })
        .eq('user_id', selectedCustomerId);
      if (updateError) throw updateError;

      // Insert transaction
      await (supabase.from('customer_credit_transactions') as any).insert({
        customer_id: selectedCustomerId,
        amount,
        balance_after: newBalance,
        transaction_type: customerCreditType,
        description: customerCreditDescription || `${customerCreditType === 'credit' ? 'Credit' : 'Debit'} by admin`,
        created_by: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customer-credits'] });
      toast({ title: 'Customer credit updated' });
      setShowCustomerCreditDialog(false);
      setSelectedCustomerId('');
      setCustomerCreditAmount('');
      setCustomerCreditDescription('');
    },
    onError: (err: any) => {
      toast({ title: err.message || 'Failed to update credit', variant: 'destructive' });
    },
  });

  const filteredCustomers = customers?.filter(c =>
    c.full_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch)
  ) || [];

  const totalCustomerCredits = customers?.reduce((s, c) => s + Number(c.credit_balance || 0), 0) || 0;
  const customersWithBalance = customers?.filter(c => Number(c.credit_balance || 0) > 0).length || 0;

  return (
    <DashboardLayout title="Credit Management" navItems={adminNavItems} roleColor="bg-red-500 text-white" roleName="Admin Panel">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatsCard
          title="Total Customer Credits"
          value={`₹${totalCustomerCredits.toLocaleString()}`}
          icon={Wallet}
          iconColor="bg-primary/10 text-primary"
        />
        <StatsCard
          title="Customers with Balance"
          value={customersWithBalance}
          icon={Wallet}
          iconColor="bg-blue-100 text-blue-600"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle>Customer Credits</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search customer..."
                  className="pl-9 w-full sm:w-[200px]"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
              <Button onClick={() => setShowCustomerCreditDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Allocate
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {customersLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No customers found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Credit Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.full_name || 'Unnamed'}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell className="text-right font-bold">
                        <span className={Number(customer.credit_balance) > 0 ? 'text-green-600' : ''}>
                          ₹{Number(customer.credit_balance || 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomerId(customer.user_id);
                            setShowCustomerCreditDialog(true);
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

      {/* Customer Credit Dialog */}
      <Dialog open={showCustomerCreditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCustomerCreditDialog(false);
          setSelectedCustomerId('');
          setCustomerCreditAmount('');
          setCustomerCreditDescription('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Customer Credit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Customer</label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((c) => (
                    <SelectItem key={c.user_id} value={c.user_id}>
                      {c.full_name || 'Unnamed'} — ₹{Number(c.credit_balance || 0).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type</label>
              <Select value={customerCreditType} onValueChange={(v) => setCustomerCreditType(v as 'credit' | 'debit')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit (Add Balance)</SelectItem>
                  <SelectItem value="debit">Debit (Deduct Balance)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Amount</label>
              <Input type="number" placeholder="Enter amount" value={customerCreditAmount} onChange={(e) => setCustomerCreditAmount(e.target.value)} min="1" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea placeholder="Reason..." value={customerCreditDescription} onChange={(e) => setCustomerCreditDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomerCreditDialog(false)}>Cancel</Button>
            <Button
              onClick={() => allocateCustomerCreditMutation.mutate()}
              disabled={allocateCustomerCreditMutation.isPending || !selectedCustomerId || !customerCreditAmount}
            >
              {allocateCustomerCreditMutation.isPending ? 'Processing...' : `${customerCreditType === 'credit' ? 'Add Credit' : 'Deduct'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminCredits;

import React from 'react';
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCustomerCredits } from '@/hooks/useCustomerCredits';

const CreditHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { creditBalance, creditHistory, isLoading } = useCustomerCredits();

  return (
    <CustomerLayout>
      <div className="max-w-[800px] mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Credit History</h1>
        </div>

        <Card className="mb-6">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className={`text-3xl font-bold mt-1 ${creditBalance < 0 ? 'text-destructive' : ''}`}>
              {creditBalance < 0 ? '-' : ''}₹{Math.abs(creditBalance).toLocaleString()}
            </p>
            {creditBalance < 0 && (
              <p className="text-xs text-destructive mt-1">You have a due amount of ₹{Math.abs(creditBalance).toLocaleString()}</p>
            )}
          </CardContent>
        </Card>

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
                        <p className="text-xs text-muted-foreground">Bal: ₹{Number(txn.balance_after).toLocaleString()}</p>
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

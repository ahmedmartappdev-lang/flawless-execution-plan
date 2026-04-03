import React from 'react';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCustomerCredits } from '@/hooks/useCustomerCredits';

const CreditHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { creditLimit, dueAmount, availableCredit, creditHistory, isLoading } = useCustomerCredits();
  const usagePercent = creditLimit > 0 ? (dueAmount / creditLimit) * 100 : 0;

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

        {/* Apply for Credit CTA */}
        <div className="mb-6">
          <Button variant="outline" className="w-full" onClick={() => navigate('/credit-apply')}>
            <CreditCard className="w-4 h-4 mr-2" />
            Apply for Credit Limit
          </Button>
        </div>

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

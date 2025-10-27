import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface Transaction {
  id: string;
  load_assignment_id: string;
  transaction_type: string;
  amount: number;
  payment_method: string;
  payment_details: string | null;
  notes: string | null;
  transaction_date: string;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    return type.includes("from_provider") ? ArrowDownCircle : ArrowUpCircle;
  };

  const getTransactionColor = (type: string) => {
    return type.includes("from_provider") ? "text-success" : "text-warning";
  };

  const formatTransactionType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          Transaction history and payment details
        </p>
      </div>

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No transactions yet</p>
            <p className="text-sm text-muted-foreground">
              Transactions will appear here when you process payments
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const Icon = getTransactionIcon(transaction.transaction_type);
            return (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-muted ${getTransactionColor(transaction.transaction_type)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {formatTransactionType(transaction.transaction_type)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.transaction_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getTransactionColor(transaction.transaction_type)}`}>
                        ₹{transaction.amount.toLocaleString()}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {transaction.payment_method.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                {(transaction.payment_details || transaction.notes) && (
                  <CardContent className="space-y-2">
                    {transaction.payment_details && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Payment Details: </span>
                        {transaction.payment_details}
                      </p>
                    )}
                    {transaction.notes && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Notes: </span>
                        {transaction.notes}
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Transactions;

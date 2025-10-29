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

interface LoadAssignment {
  id: string;
  load_id: string;
  loads: {
    id: string;
    loading_location: string;
    unloading_location: string;
  };
}

interface GroupedTransaction extends Transaction {
  load?: LoadAssignment;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<GroupedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupedByLoad, setGroupedByLoad] = useState<Record<string, GroupedTransaction[]>>({});

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          load:load_assignments!inner(
            id,
            load_id,
            loads:loads(id, loading_location, unloading_location)
          )
        `)
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      
      const transactionsData = data || [];
      setTransactions(transactionsData);

      // Group by load
      const grouped = transactionsData.reduce((acc, txn) => {
        const loadId = txn.load?.load_id || "unassigned";
        if (!acc[loadId]) acc[loadId] = [];
        acc[loadId].push(txn);
        return acc;
      }, {} as Record<string, GroupedTransaction[]>);

      setGroupedByLoad(grouped);
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
        <div className="space-y-6">
          {Object.entries(groupedByLoad).map(([loadId, loadTransactions]) => {
            const firstTxn = loadTransactions[0];
            const loadInfo = firstTxn.load?.loads;
            const totalAmount = loadTransactions.reduce((sum, t) => sum + t.amount, 0);
            const cashInHand = loadTransactions
              .filter(t => t.payment_method === "cash")
              .reduce((sum, t) => {
                return t.transaction_type.includes("from_provider") 
                  ? sum + t.amount 
                  : sum - t.amount;
              }, 0);

            return (
              <Card key={loadId} className="border-2">
                <CardHeader className="bg-muted/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-2">
                        {loadInfo ? `${loadInfo.loading_location} → ${loadInfo.unloading_location}` : "Load Transactions"}
                      </CardTitle>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{loadTransactions.length} transactions</span>
                        <span>•</span>
                        <span>Total: ₹{totalAmount.toLocaleString()}</span>
                        {cashInHand !== 0 && (
                          <>
                            <span>•</span>
                            <span className={cashInHand > 0 ? "text-success" : "text-destructive"}>
                              Cash: ₹{cashInHand.toLocaleString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  {loadTransactions.map((transaction) => {
                    const Icon = getTransactionIcon(transaction.transaction_type);
                    return (
                      <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full bg-muted ${getTransactionColor(transaction.transaction_type)}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {formatTransactionType(transaction.transaction_type)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.transaction_date).toLocaleString()}
                            </p>
                            {transaction.payment_details && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {transaction.payment_details}
                              </p>
                            )}
                            {transaction.notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Note: {transaction.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${getTransactionColor(transaction.transaction_type)}`}>
                            ₹{transaction.amount.toLocaleString()}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {transaction.payment_method.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Transactions;

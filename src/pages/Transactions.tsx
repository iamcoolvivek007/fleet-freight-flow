import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Wallet, 
  Receipt,
  DollarSign,
  Download,
  Filter
} from "lucide-react";
import { SearchBar } from "@/components/common/SearchBar";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { format, isWithinInterval } from "date-fns";

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  payment_method: string;
  transaction_date: string;
  notes?: string;
  payment_details?: string;
  load_assignment_id?: string;
}

interface Expense {
  id: string;
  amount: number;
  expense_type: string;
  payment_method: string;
  payment_date: string;
  description?: string;
  load_assignment_id: string;
}

interface Charge {
  id: string;
  amount: number;
  charge_type: string;
  charged_to: string;
  description?: string;
  load_assignment_id: string;
  created_at: string;
}

interface LoadAssignment {
  id: string;
  load_id: string;
  truck_id: string;
  loads?: {
    loading_location: string;
    unloading_location: string;
  };
  trucks?: {
    truck_number: string;
  };
}

interface CombinedTransaction {
  id: string;
  amount: number;
  type: string;
  payment_method: string;
  date: string;
  description?: string;
  load_assignment?: LoadAssignment;
  category: 'transaction' | 'expense' | 'charge';
}

const Transactions = () => {
  const [allTransactions, setAllTransactions] = useState<CombinedTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<CombinedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [allTransactions, searchQuery, dateRange, typeFilter, paymentMethodFilter]);

  const fetchAllTransactions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch regular transactions
      const { data: transactions } = await supabase
        .from("transactions")
        .select(`
          *,
          load_assignments:load_assignment_id(
            id,
            load_id,
            truck_id,
            loads(loading_location, unloading_location),
            trucks(truck_number)
          )
        `)
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false });

      // Fetch expenses
      const { data: expenses } = await supabase
        .from("expenses")
        .select(`
          *,
          load_assignments:load_assignment_id(
            id,
            load_id,
            truck_id,
            loads(loading_location, unloading_location),
            trucks(truck_number)
          )
        `)
        .eq("user_id", user.id)
        .order("payment_date", { ascending: false });

      // Fetch charges
      const { data: charges } = await supabase
        .from("charges")
        .select(`
          *,
          load_assignments:load_assignment_id(
            id,
            load_id,
            truck_id,
            loads(loading_location, unloading_location),
            trucks(truck_number)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Combine all transactions
      const combined: CombinedTransaction[] = [
        ...(transactions || []).map((t: Transaction) => ({
          id: t.id,
          amount: t.amount,
          type: t.transaction_type,
          payment_method: t.payment_method,
          date: t.transaction_date,
          description: t.notes || t.payment_details,
          load_assignment: t.load_assignment_id as any,
          category: 'transaction' as const,
        })),
        ...(expenses || []).map((e: Expense) => ({
          id: e.id,
          amount: e.amount,
          type: `expense_${e.expense_type}`,
          payment_method: e.payment_method,
          date: e.payment_date,
          description: e.description,
          load_assignment: e.load_assignment_id as any,
          category: 'expense' as const,
        })),
        ...(charges || []).map((c: Charge) => ({
          id: c.id,
          amount: c.amount,
          type: `charge_${c.charge_type}_${c.charged_to}`,
          payment_method: 'N/A',
          date: c.created_at,
          description: c.description,
          load_assignment: c.load_assignment_id as any,
          category: 'charge' as const,
        })),
      ];

      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAllTransactions(combined);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = allTransactions;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.type.toLowerCase().includes(query) ||
          t.payment_method.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          (t.load_assignment as any)?.loads?.loading_location?.toLowerCase().includes(query) ||
          (t.load_assignment as any)?.loads?.unloading_location?.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (dateRange?.from) {
      filtered = filtered.filter((t) => {
        const transDate = new Date(t.date);
        if (dateRange.to) {
          return isWithinInterval(transDate, { start: dateRange.from!, end: dateRange.to });
        }
        return transDate >= dateRange.from!;
      });
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.category === typeFilter);
    }

    // Payment method filter
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter((t) => t.payment_method === paymentMethodFilter);
    }

    setFilteredTransactions(filtered);
  };

  const getTransactionIcon = (type: string, category: string) => {
    if (category === 'expense') return <Receipt className="h-4 w-4" />;
    if (category === 'charge') return <DollarSign className="h-4 w-4" />;
    if (type.includes("from_provider") || type.includes("provider_advance")) {
      return <ArrowDownToLine className="h-4 w-4" />;
    }
    return <ArrowUpFromLine className="h-4 w-4" />;
  };

  const getTransactionColor = (type: string, category: string) => {
    if (category === 'expense') return "text-red-600";
    if (category === 'charge') return "text-purple-600";
    if (type.includes("from_provider") || type.includes("provider_advance")) {
      return "text-green-600";
    }
    return "text-blue-600";
  };

  const formatTransactionType = (type: string) => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const exportToCSV = () => {
    const headers = ["Date", "Type", "Amount", "Payment Method", "Description", "Location"];
    const rows = filteredTransactions.map(t => [
      format(new Date(t.date), "yyyy-MM-dd HH:mm"),
      formatTransactionType(t.type),
      t.amount.toString(),
      t.payment_method,
      t.description || "",
      (t.load_assignment as any)?.loads 
        ? `${(t.load_assignment as any).loads.loading_location} → ${(t.load_assignment as any).loads.unloading_location}`
        : ""
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate summary
  const totalIn = filteredTransactions
    .filter(t => t.type.includes("from_provider") || t.type.includes("provider_advance"))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalOut = filteredTransactions
    .filter(t => t.type.includes("to_driver") || t.type.includes("driver_advance") || t.category === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalIn - totalOut;

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            {filteredTransactions.length} transactions
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-green-600" />
              <p className="text-2xl font-bold text-green-600">
                ₹{totalIn.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowUpFromLine className="h-5 w-5 text-red-600" />
              <p className="text-2xl font-bold text-red-600">
                ₹{totalOut.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ₹{netBalance.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search transactions..."
            />
            
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="transaction">Transactions</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
                <SelectItem value="charge">Charges</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchQuery || dateRange || typeFilter !== "all" || paymentMethodFilter !== "all") && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setDateRange(undefined);
                setTypeFilter("all");
                setPaymentMethodFilter("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No transactions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2 rounded-lg bg-muted ${getTransactionColor(transaction.type, transaction.category)}`}>
                      {getTransactionIcon(transaction.type, transaction.category)}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {formatTransactionType(transaction.type)}
                        </p>
                        <Badge variant="outline" className="capitalize">
                          {transaction.category}
                        </Badge>
                      </div>
                      
                      {transaction.description && (
                        <p className="text-sm text-muted-foreground">
                          {transaction.description}
                        </p>
                      )}
                      
                      {(transaction.load_assignment as any)?.loads && (
                        <p className="text-sm text-muted-foreground">
                          {(transaction.load_assignment as any).loads.loading_location} → {(transaction.load_assignment as any).loads.unloading_location}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{format(new Date(transaction.date), "PPp")}</span>
                        {transaction.payment_method !== 'N/A' && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{transaction.payment_method}</span>
                          </>
                        )}
                        {(transaction.load_assignment as any)?.trucks && (
                          <>
                            <span>•</span>
                            <span>{(transaction.load_assignment as any).trucks.truck_number}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className={`text-xl font-bold ${getTransactionColor(transaction.type, transaction.category)}`}>
                    {transaction.type.includes("from_provider") || transaction.type.includes("provider_advance") ? "+" : "-"}
                    ₹{Number(transaction.amount).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Transactions;

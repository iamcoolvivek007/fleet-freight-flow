import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
} from "lucide-react";
import { TransactionFormDialog } from "./TransactionFormDialog";
import { ExpenseFormDialog } from "./ExpenseFormDialog";
import { ChargeFormDialog } from "./ChargeFormDialog";
import { PartialPaymentTracker } from "./PartialPaymentTracker";
import { getPartialPaymentProgress } from "@/lib/financialCalculations";

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  payment_method: string;
  transaction_date: string;
  payment_details?: string;
  notes?: string;
}

interface Expense {
  id: string;
  expense_type: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  description?: string;
  receipt_url?: string;
}

interface Charge {
  id: string;
  charge_type: string;
  amount: number;
  charged_to: string;
  status: string;
  description?: string;
}

interface LoadAssignment {
  id: string;
  load_id: string;
  truck_id: string;
  commission_percentage: number;
  commission_amount: number;
}

interface Load {
  id: string;
  provider_freight: number;
  truck_freight: number;
  profit?: number;
  status: string;
  payment_model?: string;
}

interface TransactionWorkflowDialogProps {
  load: Load;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

const WORKFLOW_STEPS = [
  { key: "advance_from_provider", label: "Advance from Provider", icon: TrendingUp, color: "text-success" },
  { key: "advance_to_driver", label: "Advance to Driver", icon: TrendingDown, color: "text-blue-500" },
  { key: "expenses", label: "Trip Expenses", icon: Receipt, color: "text-warning" },
  { key: "loading", label: "Loading Complete", icon: CheckCircle2, color: "text-primary" },
  { key: "in_transit", label: "In Transit", icon: Clock, color: "text-primary" },
  { key: "delivered", label: "Unloading Complete", icon: CheckCircle2, color: "text-primary" },
  { key: "charges", label: "Additional Charges", icon: AlertCircle, color: "text-amber-500" },
  { key: "balance_from_provider", label: "Balance from Provider", icon: TrendingUp, color: "text-success" },
  { key: "balance_to_driver", label: "Balance to Driver", icon: TrendingDown, color: "text-blue-500" },
  { key: "commission", label: "Commission Settlement", icon: DollarSign, color: "text-purple-500" },
  { key: "completed", label: "Final Settlement", icon: CheckCircle2, color: "text-success" },
];

export const TransactionWorkflowDialog = ({
  load,
  open,
  onOpenChange,
  onRefresh,
}: TransactionWorkflowDialogProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [assignment, setAssignment] = useState<LoadAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [selectedTransactionType, setSelectedTransactionType] = useState<string>("");

  useEffect(() => {
    if (open) {
      fetchAssignment();
    }
  }, [open, load.id]);

  const fetchAssignment = async () => {
    try {
      const { data, error } = await supabase
        .from("load_assignments")
        .select("*")
        .eq("load_id", load.id)
        .maybeSingle();

      if (error) throw error;
      setAssignment(data);
      
      if (data) {
        await Promise.all([
          fetchTransactions(data.id),
          fetchExpenses(data.id),
          fetchCharges(data.id),
        ]);
      }
    } catch (error) {
      console.error("Error fetching assignment:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (assignmentId: string) => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("load_assignment_id", assignmentId)
      .order("transaction_date", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
    } else {
      setTransactions(data || []);
    }
  };

  const fetchExpenses = async (assignmentId: string) => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("load_assignment_id", assignmentId)
      .order("payment_date", { ascending: false });

    if (error) {
      console.error("Error fetching expenses:", error);
    } else {
      setExpenses(data || []);
    }
  };

  const fetchCharges = async (assignmentId: string) => {
    const { data, error } = await supabase
      .from("charges")
      .select("*")
      .eq("load_assignment_id", assignmentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching charges:", error);
    } else {
      setCharges(data || []);
    }
  };

  const handleAddTransaction = (type: string) => {
    setSelectedTransactionType(type);
    setAddTransactionOpen(true);
  };

  const handleMarkStatus = async (status: "pending" | "assigned" | "in_transit" | "delivered" | "completed") => {
    try {
      const { error } = await supabase
        .from("loads")
        .update({ status })
        .eq("id", load.id);

      if (error) throw error;

      // If marking as completed, reactivate the truck
      if (status === "completed" && assignment) {
        const { error: truckError } = await supabase
          .from("trucks")
          .update({
            is_active: true,
            inactive_reason: null,
          })
          .eq("id", assignment.truck_id);

        if (truckError) {
          console.error("Error reactivating truck:", truckError);
          toast.error("Load completed but failed to reactivate truck");
        } else {
          toast.success("Load completed and truck reactivated successfully");
        }
      } else {
        toast.success(`Load marked as ${status}`);
      }

      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update load status");
    }
  };

  const calculateFinancials = () => {
    const providerFreight = parseFloat(load.provider_freight?.toString() || "0");
    const truckFreight = parseFloat(load.truck_freight?.toString() || "0");
    const baseProfit = providerFreight - truckFreight;
    const commission = parseFloat(assignment?.commission_amount?.toString() || "0");
    
    const totalExpenses = expenses.reduce(
      (sum, e) => sum + parseFloat(e.amount?.toString() || "0"),
      0
    );
    
    const partyCharges = charges
      .filter((c) => c.charged_to === "party" && c.status === "paid")
      .reduce((sum, c) => sum + parseFloat(c.amount?.toString() || "0"), 0);
    
    const supplierCharges = charges
      .filter((c) => c.charged_to === "supplier" && c.status === "paid")
      .reduce((sum, c) => sum + parseFloat(c.amount?.toString() || "0"), 0);

    const advanceFromProvider = transactions
      .filter((t) => t.transaction_type === "advance_from_provider")
      .reduce((sum, t) => sum + parseFloat(t.amount?.toString() || "0"), 0);

    const balanceFromProvider = transactions
      .filter((t) => t.transaction_type === "balance_from_provider")
      .reduce((sum, t) => sum + parseFloat(t.amount?.toString() || "0"), 0);

    const advanceToDriver = transactions
      .filter((t) => t.transaction_type === "advance_to_driver")
      .reduce((sum, t) => sum + parseFloat(t.amount?.toString() || "0"), 0);

    const balanceToDriver = transactions
      .filter((t) => t.transaction_type === "balance_to_driver")
      .reduce((sum, t) => sum + parseFloat(t.amount?.toString() || "0"), 0);

    const totalReceived = advanceFromProvider + balanceFromProvider + partyCharges;
    const totalPaid = advanceToDriver + balanceToDriver + totalExpenses + supplierCharges;
    
    const balanceToReceive = providerFreight + partyCharges - totalReceived;
    const balanceToPay = truckFreight + supplierCharges - (advanceToDriver + balanceToDriver);
    const cashInHand = totalReceived - totalPaid;
    const netProfit = baseProfit + commission - totalExpenses + partyCharges - supplierCharges;

    return {
      providerFreight,
      truckFreight,
      baseProfit,
      commission,
      totalExpenses,
      partyCharges,
      supplierCharges,
      totalReceived,
      totalPaid,
      balanceToReceive,
      balanceToPay,
      cashInHand,
      netProfit,
    };
  };

  const getStepStatus = (stepKey: string) => {
    if (stepKey === "loading") return load.status !== "pending";
    if (stepKey === "in_transit") return ["in_transit", "delivered", "completed"].includes(load.status);
    if (stepKey === "delivered") return ["delivered", "completed"].includes(load.status);
    if (stepKey === "completed") return load.status === "completed";
    
    // For payment transaction types, check if 100% paid
    if (stepKey === "advance_from_provider" || stepKey === "balance_from_provider") {
      const targetAmount = load.provider_freight || 0;
      const progress = getPartialPaymentProgress(transactions, stepKey, targetAmount);
      return progress.percentage >= 100;
    }
    if (stepKey === "advance_to_driver" || stepKey === "balance_to_driver") {
      const targetAmount = load.truck_freight || 0;
      const progress = getPartialPaymentProgress(transactions, stepKey, targetAmount);
      return progress.percentage >= 100;
    }
    if (stepKey === "commission") {
      const targetAmount = assignment?.commission_amount || 0;
      const progress = getPartialPaymentProgress(transactions, stepKey, targetAmount);
      return progress.percentage >= 100;
    }
    if (stepKey === "expenses") {
      return expenses.length > 0;
    }
    if (stepKey === "charges") {
      return charges.length > 0;
    }
    
    return false;
  };

  const calculateProgress = () => {
    const activeSteps = load.payment_model === 'commission_only' 
      ? WORKFLOW_STEPS.filter(step => 
          !['advance_from_provider', 'balance_from_provider', 'advance_to_driver', 'balance_to_driver'].includes(step.key)
        )
      : WORKFLOW_STEPS;
    const completedSteps = activeSteps.filter((step) => getStepStatus(step.key)).length;
    return (completedSteps / activeSteps.length) * 100;
  };

  const financials = calculateFinancials();
  
  // Filter workflow steps based on payment model
  const activeSteps = load.payment_model === 'commission_only' 
    ? WORKFLOW_STEPS.filter(step => 
        !['advance_from_provider', 'balance_from_provider', 'advance_to_driver', 'balance_to_driver'].includes(step.key)
      )
    : WORKFLOW_STEPS;

  if (!assignment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Workflow</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            No truck assigned to this load yet. Please assign a truck first.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Katha Management - Full Transaction Workflow</DialogTitle>
              <Badge variant={load.payment_model === 'commission_only' ? 'secondary' : 'default'}>
                {load.payment_model === 'commission_only' ? 'Commission-Only Model' : 'Standard Payment Model'}
              </Badge>
            </div>
          </DialogHeader>

          {/* Financial Overview */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Financial Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {load.payment_model === 'commission_only' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Commission</p>
                    <p className="text-xl font-bold text-purple-500">
                      ₹{financials.commission.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-xl font-bold text-warning">
                      ₹{financials.totalExpenses.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                    <p className={`text-xl font-bold ${financials.netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                      ₹{financials.netProfit.toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Provider Freight</p>
                    <p className="text-xl font-bold text-success">
                      ₹{financials.providerFreight.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Truck Freight</p>
                    <p className="text-xl font-bold text-blue-500">
                      ₹{financials.truckFreight.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Base Profit</p>
                    <p className="text-xl font-bold text-primary">
                      ₹{financials.baseProfit.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Commission</p>
                    <p className="text-xl font-bold text-purple-500">
                      ₹{financials.commission.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-xl font-bold text-warning">
                    ₹{financials.totalExpenses.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Charges (+/-)</p>
                  <p className="text-xl font-bold text-amber-500">
                    ₹{(financials.partyCharges - financials.supplierCharges).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className={`text-xl font-bold ${financials.netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                    ₹{financials.netProfit.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Balance Tracking */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  To Receive from Party
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">₹{(financials.providerFreight + financials.partyCharges).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Received</span>
                    <span className="font-medium text-success">₹{financials.totalReceived.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">Balance</span>
                    <span className={`font-bold text-lg ${financials.balanceToReceive > 0 ? "text-warning" : "text-success"}`}>
                      ₹{financials.balanceToReceive.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-blue-500" />
                  To Pay to Supplier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">₹{(financials.truckFreight + financials.supplierCharges).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="font-medium text-blue-500">₹{(financials.totalPaid - financials.totalExpenses).toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">Balance</span>
                    <span className={`font-bold text-lg ${financials.balanceToPay > 0 ? "text-warning" : "text-success"}`}>
                      ₹{financials.balanceToPay.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  Cash in Hand
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className={`text-3xl font-bold ${financials.cashInHand >= 0 ? "text-success" : "text-destructive"}`}>
                    ₹{financials.cashInHand.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Running Balance
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Workflow Progress</span>
              <span className="text-muted-foreground">{Math.round(calculateProgress())}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>

          {/* Workflow Steps */}
          <div className="space-y-3">
            {activeSteps.map((step) => {
              const isComplete = getStepStatus(step.key);
              const Icon = step.icon;
              const stepTransactions = transactions.filter(
                (t) => t.transaction_type === step.key
              );
              const stepExpenses = step.key === "expenses" ? expenses : [];
              const stepCharges = step.key === "charges" ? charges : [];
              
              // Check if this is a payment transaction step
              const isPaymentStep = ['advance_from_provider', 'balance_from_provider', 'advance_to_driver', 'balance_to_driver', 'commission'].includes(step.key);
              
              // Calculate payment progress for payment steps
              let targetAmount = 0;
              let paymentProgress = null;
              if (isPaymentStep) {
                if (step.key.includes('from_provider')) {
                  targetAmount = load.provider_freight || 0;
                } else if (step.key.includes('to_driver')) {
                  targetAmount = load.truck_freight || 0;
                } else if (step.key === 'commission') {
                  targetAmount = assignment?.commission_amount || 0;
                }
                paymentProgress = getPartialPaymentProgress(transactions, step.key, targetAmount);
              }

              return (
                <Card key={step.key} className={isComplete ? "border-success/30" : ""}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${step.color}`} />
                        <span className="font-medium">{step.label}</span>
                        {isComplete && (
                          <Badge variant="outline" className="text-success border-success">
                            Complete
                          </Badge>
                        )}
                      </div>
                      
                      {step.key === "expenses" && (
                        <Button
                          size="sm"
                          onClick={() => setAddExpenseOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Expense
                        </Button>
                      )}
                      {step.key === "charges" && (
                        <Button
                          size="sm"
                          onClick={() => setAddChargeOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Charge
                        </Button>
                      )}
                      
                      {step.key === "loading" && load.status === "pending" && (
                        <Button size="sm" onClick={() => handleMarkStatus("in_transit")}>
                          Mark Loaded
                        </Button>
                      )}
                      {step.key === "delivered" && load.status === "in_transit" && (
                        <Button size="sm" onClick={() => handleMarkStatus("delivered")}>
                          Mark Delivered
                        </Button>
                      )}
                      {step.key === "completed" && load.status === "delivered" && (
                        <Button size="sm" onClick={() => handleMarkStatus("completed")}>
                          Complete
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="py-2">
                    {isPaymentStep && paymentProgress ? (
                      <PartialPaymentTracker
                        title={step.label}
                        payments={stepTransactions.map(t => ({
                          id: t.id,
                          amount: t.amount,
                          payment_method: t.payment_method,
                          transaction_date: t.transaction_date
                        }))}
                        totalPaid={paymentProgress.totalPaid}
                        targetAmount={targetAmount}
                        percentage={paymentProgress.percentage}
                        onAddPayment={() => handleAddTransaction(step.key)}
                      />
                    ) : (
                      <>
                        {stepExpenses.map((expense) => (
                          <div
                            key={expense.id}
                            className="flex justify-between items-center py-2 px-3 bg-warning/10 rounded mb-2"
                          >
                            <div>
                              <p className="font-medium">{expense.expense_type.replace("_", " ").toUpperCase()}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(expense.payment_date).toLocaleDateString()} • ₹{parseFloat(expense.amount?.toString()).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {stepCharges.map((charge) => (
                          <div
                            key={charge.id}
                            className="flex justify-between items-center py-2 px-3 bg-amber-500/10 rounded mb-2"
                          >
                            <div>
                              <p className="font-medium">{charge.charge_type.replace("_", " ").toUpperCase()}</p>
                              <p className="text-xs text-muted-foreground">
                                Charged to {charge.charged_to} • ₹{parseFloat(charge.amount?.toString()).toLocaleString()} • {charge.status}
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {assignment && (
        <>
          <TransactionFormDialog
            open={addTransactionOpen}
            onOpenChange={setAddTransactionOpen}
            loadAssignmentId={assignment.id}
            transactionType={selectedTransactionType}
            onSuccess={() => {
              fetchAssignment();
              onRefresh();
            }}
          />
          
          <ExpenseFormDialog
            open={addExpenseOpen}
            onOpenChange={setAddExpenseOpen}
            loadAssignmentId={assignment.id}
            onSuccess={() => {
              fetchAssignment();
              onRefresh();
            }}
          />
          
          <ChargeFormDialog
            open={addChargeOpen}
            onOpenChange={setAddChargeOpen}
            loadAssignmentId={assignment.id}
            onSuccess={() => {
              fetchAssignment();
              onRefresh();
            }}
          />
        </>
      )}
    </>
  );
};

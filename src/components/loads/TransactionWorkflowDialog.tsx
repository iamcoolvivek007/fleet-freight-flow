import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Circle, Plus } from "lucide-react";
import { Load } from "@/pages/Loads";
import { TransactionFormDialog } from "./TransactionFormDialog";
import { toast } from "sonner";

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  payment_method: string;
  payment_details: string | null;
  notes: string | null;
  transaction_date: string;
}

interface LoadAssignment {
  id: string;
  commission_amount: number;
  commission_percentage: number;
}

interface TransactionWorkflowDialogProps {
  load: Load;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

const WORKFLOW_STEPS = [
  { 
    key: "advance_from_provider", 
    label: "Advance from Provider",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50"
  },
  { 
    key: "advance_to_driver", 
    label: "Advance to Driver",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50"
  },
  { 
    key: "unloading", 
    label: "Unloading Complete",
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50"
  },
  { 
    key: "balance_from_provider", 
    label: "Balance from Provider",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50"
  },
  { 
    key: "balance_to_driver", 
    label: "Balance to Driver",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50"
  },
  { 
    key: "commission", 
    label: "Commission Received",
    color: "bg-amber-500",
    textColor: "text-amber-700",
    bgColor: "bg-amber-50"
  },
];

export const TransactionWorkflowDialog = ({
  load,
  open,
  onOpenChange,
  onRefresh,
}: TransactionWorkflowDialogProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assignment, setAssignment] = useState<LoadAssignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [selectedTransactionType, setSelectedTransactionType] = useState<string>("");
  const [unloadingMarked, setUnloadingMarked] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTransactions();
      fetchAssignment();
    }
  }, [open]);

  const fetchAssignment = async () => {
    try {
      const { data, error } = await supabase
        .from("load_assignments")
        .select("*")
        .eq("load_id", load.id)
        .maybeSingle();

      if (error) throw error;
      setAssignment(data);
    } catch (error) {
      console.error("Error fetching assignment:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data: assignmentData } = await supabase
        .from("load_assignments")
        .select("id")
        .eq("load_id", load.id)
        .maybeSingle();

      if (!assignmentData) return;

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("load_assignment_id", assignmentData.id)
        .order("transaction_date", { ascending: true });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleAddTransaction = (type: string) => {
    setSelectedTransactionType(type);
    setAddTransactionOpen(true);
  };

  const handleMarkUnloading = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("loads")
        .update({ status: "delivered" })
        .eq("id", load.id);

      if (error) throw error;
      
      setUnloadingMarked(true);
      toast.success("Unloading marked complete");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to mark unloading");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteLoad = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("loads")
        .update({ status: "completed" })
        .eq("id", load.id);

      if (error) throw error;
      
      toast.success("Load marked complete");
      onRefresh();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to complete load");
    } finally {
      setLoading(false);
    }
  };

  const getTransactionsByType = (type: string) => {
    return transactions.filter((t) => t.transaction_type === type);
  };

  const getStepStatus = (stepKey: string) => {
    if (stepKey === "unloading") {
      return load.status === "delivered" || load.status === "completed" ? "complete" : "pending";
    }
    const stepTransactions = getTransactionsByType(stepKey);
    return stepTransactions.length > 0 ? "complete" : "pending";
  };

  const getTotalByType = (type: string) => {
    return getTransactionsByType(type).reduce((sum, t) => sum + t.amount, 0);
  };

  const calculateProgress = () => {
    const completedSteps = WORKFLOW_STEPS.filter(
      (step) => getStepStatus(step.key) === "complete"
    ).length;
    return (completedSteps / WORKFLOW_STEPS.length) * 100;
  };

  const getExpectedAmounts = () => {
    return {
      advance_from_provider: load.provider_freight * 0.5,
      balance_from_provider: load.provider_freight * 0.5,
      advance_to_driver: (load.truck_freight || 0) * 0.5,
      balance_to_driver: (load.truck_freight || 0) * 0.5,
      commission: assignment?.commission_amount || 0,
    };
  };

  const expected = getExpectedAmounts();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Workflow</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress Overview */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {WORKFLOW_STEPS.filter((s) => getStepStatus(s.key) === "complete").length} of {WORKFLOW_STEPS.length}
                  </span>
                </div>
                <Progress value={calculateProgress()} className="h-2" />
              </CardContent>
            </Card>

            {/* Workflow Steps */}
            <div className="space-y-4">
              {WORKFLOW_STEPS.map((step, index) => {
                const status = getStepStatus(step.key);
                const stepTransactions = getTransactionsByType(step.key);
                const total = getTotalByType(step.key);
                const isUnloading = step.key === "unloading";
                const expectedAmount = expected[step.key as keyof typeof expected] || 0;

                return (
                  <Card key={step.key} className={status === "complete" ? step.bgColor : ""}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {status === "complete" ? (
                            <div className={`w-8 h-8 rounded-full ${step.color} flex items-center justify-center`}>
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full border-2 border-muted flex items-center justify-center">
                              <Circle className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className={`font-semibold ${status === "complete" ? step.textColor : ""}`}>
                                {step.label}
                              </h3>
                              {!isUnloading && expectedAmount > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Expected: ₹{expectedAmount.toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 items-center">
                              {!isUnloading && (
                                <>
                                  {total > 0 && (
                                    <Badge variant={status === "complete" ? "default" : "outline"}>
                                      ₹{total.toLocaleString()}
                                    </Badge>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAddTransaction(step.key)}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add
                                  </Button>
                                </>
                              )}
                              {isUnloading && status !== "complete" && (
                                <Button
                                  size="sm"
                                  onClick={handleMarkUnloading}
                                  disabled={loading}
                                >
                                  Mark Complete
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Transaction List */}
                          {stepTransactions.length > 0 && (
                            <div className="space-y-2 pl-4 border-l-2 border-muted">
                              {stepTransactions.map((txn) => (
                                <div key={txn.id} className="text-sm space-y-1">
                                  <div className="flex justify-between">
                                    <span className="font-medium">₹{txn.amount.toLocaleString()}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {txn.payment_method.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <div className="text-muted-foreground">
                                    {new Date(txn.transaction_date).toLocaleDateString()}
                                  </div>
                                  {txn.payment_details && (
                                    <div className="text-muted-foreground">
                                      Details: {txn.payment_details}
                                    </div>
                                  )}
                                  {txn.notes && (
                                    <div className="text-muted-foreground">
                                      Notes: {txn.notes}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Complete Load Button */}
            {calculateProgress() === 100 && load.status !== "completed" && (
              <Button
                className="w-full"
                size="lg"
                onClick={handleCompleteLoad}
                disabled={loading}
              >
                Complete Load & Close Workflow
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {assignment && (
        <TransactionFormDialog
          open={addTransactionOpen}
          onOpenChange={setAddTransactionOpen}
          loadAssignmentId={assignment.id}
          transactionType={selectedTransactionType}
          onSuccess={() => {
            fetchTransactions();
            onRefresh();
            setAddTransactionOpen(false);
          }}
        />
      )}
    </>
  );
};

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

/**
 * @interface Transaction
 * @description The transaction interface.
 * @property {string} id - The transaction ID.
 * @property {number} amount - The transaction amount.
 * @property {string} transaction_type - The transaction type.
 * @property {string} payment_method - The payment method.
 * @property {string} transaction_date - The transaction date.
 * @property {string} [payment_details] - The payment details.
 * @property {string} [notes] - The transaction notes.
 */
interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  payment_method: string;
  transaction_date: string;
  payment_details?: string;
  notes?: string;
}

/**
 * @interface TransactionFormDialogProps
 * @description The props for the TransactionFormDialog component.
 * @property {boolean} open - Whether the dialog is open.
 * @property {(open: boolean) => void} onOpenChange - The function to call when the dialog is opened or closed.
 * @property {string} loadAssignmentId - The ID of the load assignment.
 * @property {string} transactionType - The type of transaction.
 * @property {() => void} onSuccess - The function to call when the transaction is successfully added or updated.
 * @property {Transaction | null} [transaction] - The transaction to edit.
 * @property {'create' | 'edit'} [mode] - The mode of the dialog.
 */
interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadAssignmentId: string;
  transactionType: string;
  onSuccess: () => void;
  transaction?: Transaction | null;
  mode?: 'create' | 'edit';
}

const TRANSACTION_LABELS: Record<string, string> = {
  advance_from_provider: "Advance from Provider",
  balance_from_provider: "Balance from Provider",
  advance_to_driver: "Advance to Driver",
  balance_to_driver: "Balance to Driver",
  commission: "Commission",
};

/**
 * @name TransactionFormDialog
 * @description A dialog for adding or editing a transaction.
 * @param {TransactionFormDialogProps} props - The props for the component.
 * @returns {JSX.Element} - The JSX for the component.
 */
export const TransactionFormDialog = ({
  open,
  onOpenChange,
  loadAssignmentId,
  transactionType,
  onSuccess,
  transaction = null,
  mode = 'create',
}: TransactionFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    payment_method: "",
    payment_details: "",
    notes: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (transaction && mode === 'edit') {
      setFormData({
        amount: transaction.amount.toString(),
        payment_method: transaction.payment_method,
        payment_details: transaction.payment_details || "",
        notes: transaction.notes || "",
        transaction_date: new Date(transaction.transaction_date).toISOString().split("T")[0],
      });
    } else {
      setFormData({
        amount: "",
        payment_method: "",
        payment_details: "",
        notes: "",
        transaction_date: new Date().toISOString().split("T")[0],
      });
    }
  }, [transaction, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const transactionData = {
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method as any,
        payment_details: formData.payment_details || null,
        notes: formData.notes || null,
        transaction_date: new Date(formData.transaction_date).toISOString(),
      };

      if (mode === 'edit' && transaction) {
        const { error } = await supabase
          .from("transactions")
          .update(transactionData)
          .eq('id', transaction.id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success("Transaction updated successfully");
      } else {
        const { error } = await supabase.from("transactions").insert({
          ...transactionData,
          load_assignment_id: loadAssignmentId,
          transaction_type: transactionType as any,
          user_id: user.id,
        });

        if (error) throw error;
        toast.success("Transaction added successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${mode} transaction`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit' : 'Add'} {TRANSACTION_LABELS[transactionType]}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Enter amount"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction_date">Transaction Date *</Label>
            <Input
              id="transaction_date"
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method *</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_details">Payment Details</Label>
            <Input
              id="payment_details"
              value={formData.payment_details}
              onChange={(e) => setFormData({ ...formData, payment_details: e.target.value })}
              placeholder="e.g., Transaction ID, Reference Number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading 
                ? `${mode === 'edit' ? 'Updating' : 'Adding'}...` 
                : `${mode === 'edit' ? 'Update' : 'Add'} Transaction`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

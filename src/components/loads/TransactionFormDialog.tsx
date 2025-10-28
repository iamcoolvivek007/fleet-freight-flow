import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadAssignmentId: string;
  transactionType: string;
  onSuccess: () => void;
}

const TRANSACTION_LABELS: Record<string, string> = {
  advance_from_provider: "Advance from Provider",
  balance_from_provider: "Balance from Provider",
  advance_to_driver: "Advance to Driver",
  balance_to_driver: "Balance to Driver",
  commission: "Commission",
};

export const TransactionFormDialog = ({
  open,
  onOpenChange,
  loadAssignmentId,
  transactionType,
  onSuccess,
}: TransactionFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    payment_method: "",
    payment_details: "",
    notes: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("transactions").insert({
        load_assignment_id: loadAssignmentId,
        transaction_type: transactionType as any,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method as any,
        payment_details: formData.payment_details || null,
        notes: formData.notes || null,
        transaction_date: new Date(formData.transaction_date).toISOString(),
        user_id: user.id,
      });

      if (error) throw error;

      toast.success("Transaction added successfully");
      onSuccess();
      setFormData({
        amount: "",
        payment_method: "",
        payment_details: "",
        notes: "",
        transaction_date: new Date().toISOString().split("T")[0],
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {TRANSACTION_LABELS[transactionType]}</DialogTitle>
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
              {loading ? "Adding..." : "Add Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

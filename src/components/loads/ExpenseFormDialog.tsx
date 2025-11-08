import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

/**
 * @interface ExpenseFormDialogProps
 * @description The props for the ExpenseFormDialog component.
 * @property {boolean} open - Whether the dialog is open.
 * @property {(open: boolean) => void} onOpenChange - The function to call when the dialog is opened or closed.
 * @property {string} loadAssignmentId - The ID of the load assignment.
 * @property {() => void} onSuccess - The function to call when the expense is successfully added.
 */
interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadAssignmentId: string;
  onSuccess: () => void;
}

const EXPENSE_TYPES = {
  fuel: "Fuel",
  toll: "Toll",
  maintenance: "Maintenance",
  driver_allowance: "Driver Allowance",
  loading_charges: "Loading Charges",
  unloading_charges: "Unloading Charges",
  other: "Other",
};

const PAYMENT_METHODS = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
};

/**
 * @name ExpenseFormDialog
 * @description A dialog for adding an expense to a load.
 * @param {ExpenseFormDialogProps} props - The props for the component.
 * @returns {JSX.Element} - The JSX for the component.
 */
export const ExpenseFormDialog = ({
  open,
  onOpenChange,
  loadAssignmentId,
  onSuccess,
}: ExpenseFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    expense_type: "fuel",
    amount: "",
    payment_method: "cash",
    payment_date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadReceipt = async (): Promise<string | null> => {
    if (!receiptFile) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileExt = receiptFile.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("expense-receipts")
      .upload(fileName, receiptFile);

    if (error) {
      console.error("Error uploading receipt:", error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("expense-receipts")
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const receiptUrl = await uploadReceipt();

      const { error } = await supabase.from("expenses").insert({
        load_assignment_id: loadAssignmentId,
        expense_type: formData.expense_type,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        payment_date: new Date(formData.payment_date).toISOString(),
        description: formData.description || null,
        receipt_url: receiptUrl,
        user_id: user.id,
      });

      if (error) throw error;

      toast.success("Expense added successfully");
      onSuccess();
      onOpenChange(false);
      setFormData({
        expense_type: "fuel",
        amount: "",
        payment_method: "cash",
        payment_date: new Date().toISOString().split("T")[0],
        description: "",
      });
      setReceiptFile(null);
      setReceiptPreview(null);
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Expense Type</Label>
            <Select
              value={formData.expense_type}
              onValueChange={(value) =>
                setFormData({ ...formData, expense_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EXPENSE_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) =>
                setFormData({ ...formData, payment_method: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              required
              value={formData.payment_date}
              onChange={(e) =>
                setFormData({ ...formData, payment_date: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Receipt (Optional)</Label>
            {receiptPreview ? (
              <div className="relative">
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setReceiptFile(null);
                    setReceiptPreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptChange}
                  className="hidden"
                  id="receipt-upload"
                />
                <label htmlFor="receipt-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload receipt
                  </p>
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Adding..." : "Add Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

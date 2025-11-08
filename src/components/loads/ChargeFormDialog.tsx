import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * @interface ChargeFormDialogProps
 * @description The props for the ChargeFormDialog component.
 * @property {boolean} open - Whether the dialog is open.
 * @property {(open: boolean) => void} onOpenChange - The function to call when the dialog is opened or closed.
 * @property {string} loadAssignmentId - The ID of the load assignment.
 * @property {() => void} onSuccess - The function to call when the charge is successfully added.
 */
interface ChargeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadAssignmentId: string;
  onSuccess: () => void;
}

const CHARGE_TYPES = {
  detention: "Detention",
  late_delivery: "Late Delivery",
  damage: "Damage",
  extra_loading: "Extra Loading",
  other: "Other",
};

/**
 * @name ChargeFormDialog
 * @description A dialog for adding an additional charge to a load.
 * @param {ChargeFormDialogProps} props - The props for the component.
 * @returns {JSX.Element} - The JSX for the component.
 */
export const ChargeFormDialog = ({
  open,
  onOpenChange,
  loadAssignmentId,
  onSuccess,
}: ChargeFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    charge_type: "detention",
    amount: "",
    charged_to: "party",
    status: "pending",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { error } = await supabase.from("charges").insert({
        load_assignment_id: loadAssignmentId,
        charge_type: formData.charge_type,
        amount: parseFloat(formData.amount),
        charged_to: formData.charged_to,
        status: formData.status,
        description: formData.description || null,
        user_id: user.id,
      });

      if (error) throw error;

      toast.success("Charge added successfully");
      onSuccess();
      onOpenChange(false);
      setFormData({
        charge_type: "detention",
        amount: "",
        charged_to: "party",
        status: "pending",
        description: "",
      });
    } catch (error) {
      console.error("Error adding charge:", error);
      toast.error("Failed to add charge");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Additional Charge</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Charge Type</Label>
            <Select
              value={formData.charge_type}
              onValueChange={(value) =>
                setFormData({ ...formData, charge_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHARGE_TYPES).map(([key, label]) => (
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
            <Label>Charged To</Label>
            <Select
              value={formData.charged_to}
              onValueChange={(value) =>
                setFormData({ ...formData, charged_to: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="party">Party (Load Provider)</SelectItem>
                <SelectItem value="supplier">Supplier (Driver)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="waived">Waived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
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
              {loading ? "Adding..." : "Add Charge"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

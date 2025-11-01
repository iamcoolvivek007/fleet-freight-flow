import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Load } from "@/pages/Loads";

interface Truck {
  id: string;
  truck_number: string;
  driver_name: string;
  truck_type: string;
  carrying_capacity: number;
}

interface AssignTruckDialogProps {
  load: Load;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AssignTruckDialog = ({ load, open, onOpenChange, onSuccess }: AssignTruckDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selectedTruck, setSelectedTruck] = useState("");
  const [truckFreight, setTruckFreight] = useState(load.truck_freight?.toString() || "");
  const [commissionPercentage, setCommissionPercentage] = useState("10");

  useEffect(() => {
    if (open) {
      fetchTrucks();
      setTruckFreight(load.truck_freight?.toString() || "");
    }
  }, [open, load]);

  const fetchTrucks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("trucks")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) throw error;
      setTrucks(data || []);
    } catch (error) {
      console.error("Error fetching trucks:", error);
    }
  };

  const calculateProfit = () => {
    if (!truckFreight) return 0;
    const baseProfit = load.provider_freight - parseFloat(truckFreight);
    const commission = (parseFloat(truckFreight) * parseFloat(commissionPercentage)) / 100;
    return baseProfit + commission;
  };

  const calculateCommission = () => {
    if (!truckFreight) return 0;
    return (parseFloat(truckFreight) * parseFloat(commissionPercentage)) / 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTruck || !truckFreight) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const truckFreightNum = parseFloat(truckFreight);
      const commissionPct = parseFloat(commissionPercentage);
      const commissionAmt = (truckFreightNum * commissionPct) / 100;

      // Update load status and freight
      const { error: loadError } = await supabase
        .from("loads")
        .update({
          status: "assigned",
          truck_freight: truckFreightNum,
          profit: load.provider_freight - truckFreightNum,
        })
        .eq("id", load.id);

      if (loadError) throw loadError;

      // Create load assignment
      const { error: assignError } = await supabase
        .from("load_assignments")
        .insert({
          load_id: load.id,
          truck_id: selectedTruck,
          commission_percentage: commissionPct,
          commission_amount: commissionAmt,
          user_id: user.id,
        });

      if (assignError) throw assignError;

      // Auto-deactivate truck with reason
      const { error: truckError } = await supabase
        .from("trucks")
        .update({
          is_active: false,
          inactive_reason: 'assigned_to_load',
        })
        .eq("id", selectedTruck);

      if (truckError) throw truckError;

      toast.success("Truck assigned successfully and marked as inactive");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign truck");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Truck to Load</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h3 className="font-semibold">Load Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p><span className="text-muted-foreground">From:</span> {load.loading_location}</p>
              <p><span className="text-muted-foreground">To:</span> {load.unloading_location}</p>
              <p><span className="text-muted-foreground">Material:</span> {load.material_description}</p>
              <p><span className="text-muted-foreground">Weight:</span> {load.material_weight} tons</p>
              <p className="col-span-2 font-medium text-primary">
                <span className="text-muted-foreground">Provider Freight:</span> ₹{load.provider_freight.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="truck">Select Truck *</Label>
            <Select value={selectedTruck} onValueChange={setSelectedTruck} required>
              <SelectTrigger>
                <SelectValue placeholder="Choose a truck" />
              </SelectTrigger>
              <SelectContent>
                {trucks.map((truck) => (
                  <SelectItem key={truck.id} value={truck.id}>
                    {truck.truck_number} - {truck.driver_name} ({truck.truck_type}, {truck.carrying_capacity}T)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="truck_freight">Confirm Truck Freight (₹) *</Label>
              <Input
                id="truck_freight"
                type="number"
                step="0.01"
                value={truckFreight}
                onChange={(e) => setTruckFreight(e.target.value)}
                placeholder="Enter truck freight"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission">Commission (%) *</Label>
              <Input
                id="commission"
                type="number"
                step="0.01"
                value={commissionPercentage}
                onChange={(e) => setCommissionPercentage(e.target.value)}
                required
              />
            </div>
          </div>

          {truckFreight && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Provider Freight:</span>
                <span className="font-medium">₹{load.provider_freight.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Truck Freight:</span>
                <span className="font-medium">₹{parseFloat(truckFreight).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Commission ({commissionPercentage}% of truck freight):</span>
                <span className="font-medium text-success">+₹{calculateCommission().toLocaleString()}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between font-semibold">
                <span>Base Profit:</span>
                <span className="text-muted-foreground">₹{(load.provider_freight - parseFloat(truckFreight || "0")).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total Profit:</span>
                <span className="text-primary">₹{calculateProfit().toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedTruck || !truckFreight}>
              {loading ? "Assigning..." : "Assign Truck"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TruckForm } from "@/components/trucks/TruckForm";
import { TrucksList } from "@/components/trucks/TrucksList";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface Truck {
  id: string;
  truck_number: string;
  driver_name: string;
  driver_phone: string;
  owner_name: string;
  owner_phone: string;
  third_party_contact: string | null;
  truck_type: "open" | "container";
  truck_length: number;
  carrying_capacity: number;
  is_active: boolean;
}

const Trucks = () => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);

  useEffect(() => {
    fetchTrucks();
  }, []);

  const fetchTrucks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("trucks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTrucks(data || []);
    } catch (error) {
      console.error("Error fetching trucks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (truck: Truck) => {
    setEditingTruck(truck);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTruck(null);
  };

  const handleSuccess = () => {
    fetchTrucks();
    handleCloseDialog();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trucks</h1>
          <p className="text-muted-foreground">
            Manage your fleet of trucks
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Truck
        </Button>
      </div>

      <TrucksList 
        trucks={trucks} 
        loading={loading} 
        onEdit={handleEdit}
        onRefresh={fetchTrucks}
      />

      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTruck ? "Edit Truck" : "Add New Truck"}
            </DialogTitle>
          </DialogHeader>
          <TruckForm 
            truck={editingTruck} 
            onSuccess={handleSuccess}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Trucks;

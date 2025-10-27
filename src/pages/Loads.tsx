import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LoadForm } from "@/components/loads/LoadForm";
import { LoadsList } from "@/components/loads/LoadsList";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface Load {
  id: string;
  load_provider_id: string;
  loading_location: string;
  unloading_location: string;
  material_description: string;
  material_weight: number;
  provider_freight: number;
  truck_freight: number | null;
  profit: number | null;
  status: "pending" | "assigned" | "in_transit" | "delivered" | "completed";
  created_at: string;
}

const Loads = () => {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("loads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLoads(data || []);
    } catch (error) {
      console.error("Error fetching loads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (load: Load) => {
    setEditingLoad(load);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLoad(null);
  };

  const handleSuccess = () => {
    fetchLoads();
    handleCloseDialog();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loads</h1>
          <p className="text-muted-foreground">
            Manage freight loads and assignments
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Load
        </Button>
      </div>

      <LoadsList 
        loads={loads} 
        loading={loading} 
        onEdit={handleEdit}
        onRefresh={fetchLoads}
      />

      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLoad ? "Edit Load" : "Create New Load"}
            </DialogTitle>
          </DialogHeader>
          <LoadForm 
            load={editingLoad} 
            onSuccess={handleSuccess}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Loads;

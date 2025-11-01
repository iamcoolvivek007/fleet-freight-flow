import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadForm } from "@/components/loads/LoadForm";
import { LoadsList } from "@/components/loads/LoadsList";
import { SearchBar } from "@/components/common/SearchBar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface Load {
  id: string;
  user_id: string;
  load_provider_id: string;
  loading_location: string;
  unloading_location: string;
  material_description: string;
  material_weight: number;
  provider_freight: number;
  truck_freight: number | null;
  status: string;
  profit?: number;
  payment_model?: string;
  created_at: string;
}

const Loads = () => {
  const [loads, setLoads] = useState<Load[]>([]);
  const [filteredLoads, setFilteredLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchLoads();
  }, []);

  useEffect(() => {
    filterLoads();
  }, [loads, searchQuery, statusFilter]);

  const fetchLoads = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("No user found");
        return;
      }

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

  const filterLoads = () => {
    let filtered = loads;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(load => load.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (load) =>
          load.loading_location.toLowerCase().includes(query) ||
          load.unloading_location.toLowerCase().includes(query) ||
          load.material_description.toLowerCase().includes(query)
      );
    }

    setFilteredLoads(filtered);
  };

  const handleEdit = (load: Load) => {
    setEditingLoad(load);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLoad(null);
  };

  const handleSuccess = () => {
    fetchLoads();
    handleCloseDialog();
  };

  const statusCounts = {
    pending: loads.filter(l => l.status === 'pending').length,
    assigned: loads.filter(l => l.status === 'assigned').length,
    in_transit: loads.filter(l => l.status === 'in_transit').length,
    delivered: loads.filter(l => l.status === 'delivered').length,
    completed: loads.filter(l => l.status === 'completed').length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Loads</h1>
          <p className="text-muted-foreground mt-1">
            {statusCounts.pending} pending • {statusCounts.assigned} assigned • {statusCounts.completed} completed
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Load
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by location or material..."
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status ({loads.length})</SelectItem>
            <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
            <SelectItem value="assigned">Assigned ({statusCounts.assigned})</SelectItem>
            <SelectItem value="in_transit">In Transit ({statusCounts.in_transit})</SelectItem>
            <SelectItem value="delivered">Delivered ({statusCounts.delivered})</SelectItem>
            <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <LoadsList
        loads={filteredLoads}
        loading={loading}
        onEdit={handleEdit}
        onRefresh={fetchLoads}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLoad ? "Edit Load" : "Create New Load"}</DialogTitle>
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

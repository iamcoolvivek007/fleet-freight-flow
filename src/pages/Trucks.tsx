import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TruckForm } from "@/components/trucks/TruckForm";
import { TrucksList } from "@/components/trucks/TrucksList";
import { SearchBar } from "@/components/common/SearchBar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface Truck {
  id: string;
  truck_number: string;
  driver_name: string;
  driver_phone: string;
  owner_name: string;
  owner_phone: string;
  third_party_name?: string | null;
  third_party_contact?: string | null;
  truck_type: "open" | "container";
  truck_length: number;
  carrying_capacity: number;
  truck_image_url: string | null;
  driver_image_url: string | null;
  is_active: boolean;
  created_at: string;
}

const Trucks = () => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [filteredTrucks, setFilteredTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    fetchTrucks();
  }, []);

  useEffect(() => {
    filterTrucks();
  }, [trucks, searchQuery, statusFilter]);

  const fetchTrucks = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("No user found");
        return;
      }

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

  const filterTrucks = () => {
    let filtered = trucks;

    // Apply status filter
    if (statusFilter === "active") {
      filtered = filtered.filter(truck => truck.is_active);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter(truck => !truck.is_active);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (truck) =>
          truck.truck_number.toLowerCase().includes(query) ||
          truck.driver_name.toLowerCase().includes(query) ||
          truck.owner_name.toLowerCase().includes(query) ||
          truck.third_party_name?.toLowerCase().includes(query) ||
          truck.driver_phone.includes(query) ||
          truck.owner_phone.includes(query)
      );
    }

    setFilteredTrucks(filtered);
  };

  const handleEdit = (truck: Truck) => {
    setEditingTruck(truck);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTruck(null);
  };

  const handleSuccess = () => {
    fetchTrucks();
    handleCloseDialog();
  };

  const activeCount = trucks.filter(t => t.is_active).length;
  const inactiveCount = trucks.filter(t => !t.is_active).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Trucks</h1>
          <p className="text-muted-foreground mt-1">
            {activeCount} active • {inactiveCount} inactive • {trucks.length} total
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Truck
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by truck number, driver, owner, or 3rd party..."
          className="flex-1"
        />
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All ({trucks.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
            <TabsTrigger value="inactive">Inactive ({inactiveCount})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <TrucksList
        trucks={filteredTrucks}
        loading={loading}
        onEdit={handleEdit}
        onRefresh={fetchTrucks}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTruck ? "Edit Truck" : "Add New Truck"}</DialogTitle>
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

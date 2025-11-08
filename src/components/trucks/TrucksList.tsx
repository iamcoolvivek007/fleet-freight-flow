import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Truck } from "@/pages/Trucks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Phone, User, Truck as TruckIcon, History, ChevronDown, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

/**
 * @interface LoadHistory
 * @description The load history interface.
 * @property {string} id - The history ID.
 * @property {string} load_id - The load ID.
 * @property {string} assigned_at - The assignment date.
 * @property {object} load - The load object.
 * @property {string} load.id - The load ID.
 * @property {string} load.loading_location - The loading location.
 * @property {string} load.unloading_location - The unloading location.
 * @property {string} load.status - The load status.
 * @property {number} load.provider_freight - The provider freight.
 * @property {number} load.truck_freight - The truck freight.
 * @property {string} load.created_at - The creation date.
 */
interface LoadHistory {
  id: string;
  load_id: string;
  assigned_at: string;
  load: {
    id: string;
    loading_location: string;
    unloading_location: string;
    status: string;
    provider_freight: number;
    truck_freight: number;
    created_at: string;
  };
}

/**
 * @interface TrucksListProps
 * @description The props for the TrucksList component.
 * @property {Truck[]} trucks - The list of trucks.
 * @property {boolean} loading - Whether the list is loading.
 * @property {(truck: Truck) => void} onEdit - The function to call when the edit button is clicked.
 * @property {() => void} onRefresh - The function to call when the list needs to be refreshed.
 */
interface TrucksListProps {
  trucks: Truck[];
  loading: boolean;
  onEdit: (truck: Truck) => void;
  onRefresh: () => void;
}

/**
 * @name TrucksList
 * @description A component to display a list of trucks.
 * @param {TrucksListProps} props - The props for the component.
 * @returns {JSX.Element} - The JSX for the component.
 */
export const TrucksList = ({ trucks, loading, onEdit }: TrucksListProps) => {
  const [loadHistory, setLoadHistory] = useState<Record<string, LoadHistory[]>>({});
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (trucks.length > 0) {
      fetchLoadHistory();
    }
  }, [trucks]);

  const fetchLoadHistory = async () => {
    setLoadingHistory(true);
    try {
      const truckIds = trucks.map(t => t.id);
      
      const { data, error } = await supabase
        .from("load_assignments")
        .select(`
          *,
          loads!inner(
            id,
            loading_location,
            unloading_location,
            status,
            provider_freight,
            truck_freight,
            created_at
          )
        `)
        .in("truck_id", truckIds)
        .order("assigned_at", { ascending: false });

      if (error) throw error;

      const historyMap: Record<string, LoadHistory[]> = {};
      data?.forEach((assignment) => {
        if (!historyMap[assignment.truck_id]) {
          historyMap[assignment.truck_id] = [];
        }
        historyMap[assignment.truck_id].push({
          id: assignment.id,
          load_id: assignment.load_id,
          assigned_at: assignment.assigned_at,
          load: assignment.loads,
        });
      });

      setLoadHistory(historyMap);
    } catch (error) {
      console.error("Error fetching load history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (trucks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No trucks added yet</p>
          <p className="text-sm text-muted-foreground">Click "Add Truck" to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {trucks.map((truck) => (
        <Card key={truck.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{truck.truck_number}</CardTitle>
              <div className="flex gap-2">
                <Badge variant={truck.is_active ? "default" : "secondary"}>
                  {truck.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline">{truck.truck_type}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(truck.truck_image_url || truck.driver_image_url) && (
              <div className="grid grid-cols-2 gap-2 pb-3 border-b">
                {truck.truck_image_url && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Truck</p>
                    <img 
                      src={truck.truck_image_url} 
                      alt="Truck" 
                      className="w-full h-20 object-cover rounded-md"
                    />
                  </div>
                )}
                {truck.driver_image_url && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Driver</p>
                    <img 
                      src={truck.driver_image_url} 
                      alt="Driver" 
                      className="w-full h-20 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Driver:</span>
                <span className="ml-1">{truck.driver_name}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="mr-2 h-4 w-4" />
                {truck.driver_phone}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Owner:</span>
                <span className="ml-1">{truck.owner_name}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="mr-2 h-4 w-4" />
                {truck.owner_phone}
              </div>
            </div>

            {(truck.third_party_name || truck.third_party_contact) && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center text-sm">
                  <TruckIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">3rd Party:</span>
                  <span className="ml-1">{truck.third_party_name || "N/A"}</span>
                </div>
                {truck.third_party_contact && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="mr-2 h-4 w-4" />
                    {truck.third_party_contact}
                  </div>
                )}
              </div>
            )}

            {(truck.truck_length || truck.carrying_capacity) && (
              <div className="flex gap-4 text-sm pt-2 border-t">
                {truck.truck_length && (
                  <div>
                    <span className="text-muted-foreground">Length:</span>
                    <span className="ml-1 font-medium">{truck.truck_length} ft</span>
                  </div>
                )}
                {truck.carrying_capacity && (
                  <div>
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="ml-1 font-medium">{truck.carrying_capacity} tons</span>
                  </div>
                )}
              </div>
            )}

            {loadHistory[truck.id] && loadHistory[truck.id].length > 0 && (
              <Collapsible className="space-y-2 pt-3 border-t">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span className="flex items-center">
                      <History className="mr-2 h-4 w-4" />
                      Load History ({loadHistory[truck.id].length})
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2">
                  {loadHistory[truck.id].map((history) => (
                    <div key={history.id} className="p-2 border rounded-md text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-muted-foreground">
                          Load #{history.load_id.substring(0, 8)}
                        </span>
                        <Badge variant={history.load.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {history.load.status}
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="mr-1 h-3 w-3" />
                        {history.load.loading_location} → {history.load.unloading_location}
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Freight: ₹{history.load.truck_freight?.toLocaleString()}</span>
                        <span className="text-muted-foreground">
                          {new Date(history.assigned_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {(!loadHistory[truck.id] || loadHistory[truck.id].length === 0) && !loadingHistory && (
              <div className="text-xs text-center text-muted-foreground py-2 border-t rounded-md mt-3">
                No loads assigned yet
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => onEdit(truck)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

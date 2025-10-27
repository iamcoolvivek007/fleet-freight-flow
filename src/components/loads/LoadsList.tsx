import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Load } from "@/pages/Loads";
import { LoadProvider } from "@/pages/LoadProviders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, MapPin, Package, DollarSign, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadsListProps {
  loads: Load[];
  loading: boolean;
  onEdit: (load: Load) => void;
  onRefresh: () => void;
}

export const LoadsList = ({ loads, loading, onEdit }: LoadsListProps) => {
  const [providers, setProviders] = useState<Record<string, LoadProvider>>({});

  useEffect(() => {
    fetchProviders();
  }, [loads]);

  const fetchProviders = async () => {
    try {
      const providerIds = [...new Set(loads.map((l) => l.load_provider_id))];
      if (providerIds.length === 0) return;

      const { data, error } = await supabase
        .from("load_providers")
        .select("*")
        .in("id", providerIds);

      if (error) throw error;

      const providersMap: Record<string, LoadProvider> = {};
      data?.forEach((p) => {
        providersMap[p.id] = p;
      });
      setProviders(providersMap);
    } catch (error) {
      console.error("Error fetching providers:", error);
    }
  };

  const getStatusColor = (status: Load["status"]) => {
    const colors = {
      pending: "secondary",
      assigned: "default",
      in_transit: "default",
      delivered: "outline",
      completed: "outline",
    };
    return colors[status] as any;
  };

  const getStatusLabel = (status: Load["status"]) => {
    return status.replace("_", " ").toUpperCase();
  };

  if (loading) {
    return (
      <div className="grid gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (loads.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No loads created yet</p>
          <p className="text-sm text-muted-foreground">Click "Create Load" to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {loads.map((load) => (
        <Card key={load.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg mb-1">
                  {providers[load.load_provider_id]?.provider_name || "Loading..."}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Created {new Date(load.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={getStatusColor(load.status)}>
                {getStatusLabel(load.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-start text-sm">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">From: {load.loading_location}</p>
                    <p className="text-muted-foreground">To: {load.unloading_location}</p>
                  </div>
                </div>
                <div className="flex items-start text-sm">
                  <Package className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{load.material_description}</p>
                    <p className="text-muted-foreground">{load.material_weight} tons</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Provider Freight:</span>
                  <span className="font-medium">₹{load.provider_freight?.toLocaleString()}</span>
                </div>
                {load.truck_freight && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Truck Freight:</span>
                      <span className="font-medium">₹{load.truck_freight.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="flex items-center text-success font-medium">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        Profit:
                      </span>
                      <span className="font-bold text-success">
                        ₹{load.profit?.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(load)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              {load.status === "pending" && (
                <Button size="sm">
                  Assign Truck
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

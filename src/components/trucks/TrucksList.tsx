import { Truck } from "@/pages/Trucks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Phone, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TrucksListProps {
  trucks: Truck[];
  loading: boolean;
  onEdit: (truck: Truck) => void;
  onRefresh: () => void;
}

export const TrucksList = ({ trucks, loading, onEdit }: TrucksListProps) => {
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

import { Badge } from "@/components/ui/badge";
import { Truck, AlertCircle, Wrench } from "lucide-react";

interface TruckStatusBadgeProps {
  isActive: boolean;
  inactiveReason?: string | null;
  loadId?: string;
}

export const TruckStatusBadge = ({ isActive, inactiveReason, loadId }: TruckStatusBadgeProps) => {
  if (isActive) {
    return (
      <Badge variant="default" className="gap-1">
        <Truck className="h-3 w-3" />
        Available
      </Badge>
    );
  }

  if (inactiveReason === 'assigned_to_load' && loadId) {
    return (
      <Badge variant="secondary" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Assigned to Load
      </Badge>
    );
  }

  if (inactiveReason === 'maintenance') {
    return (
      <Badge variant="destructive" className="gap-1">
        <Wrench className="h-3 w-3" />
        In Maintenance
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1">
      <AlertCircle className="h-3 w-3" />
      Inactive
    </Badge>
  );
};

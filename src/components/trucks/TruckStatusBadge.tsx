import { Badge } from "@/components/ui/badge";
import { Truck, AlertCircle, Wrench } from "lucide-react";

/**
 * @interface TruckStatusBadgeProps
 * @description The props for the TruckStatusBadge component.
 * @property {boolean} isActive - Whether the truck is active.
 * @property {string | null} [inactiveReason] - The reason the truck is inactive.
 * @property {string} [loadId] - The ID of the load the truck is assigned to.
 */
interface TruckStatusBadgeProps {
  isActive: boolean;
  inactiveReason?: string | null;
  loadId?: string;
}

/**
 * @name TruckStatusBadge
 * @description A badge to display the status of a truck.
 * @param {TruckStatusBadgeProps} props - The props for the component.
 * @returns {JSX.Element} - The JSX for the component.
 */
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

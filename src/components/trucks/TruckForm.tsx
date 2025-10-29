import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Truck } from "@/pages/Trucks";

interface TruckFormProps {
  truck?: Truck | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const TruckForm = ({ truck, onSuccess, onCancel }: TruckFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    truck_number: "",
    driver_name: "",
    driver_phone: "",
    owner_name: "",
    owner_phone: "",
    third_party_contact: "",
    truck_type: "open" as "open" | "container",
    truck_length: "",
    carrying_capacity: "",
    is_active: true,
  });

  useEffect(() => {
    if (truck) {
      setFormData({
        truck_number: truck.truck_number,
        driver_name: truck.driver_name,
        driver_phone: truck.driver_phone,
        owner_name: truck.owner_name,
        owner_phone: truck.owner_phone,
        third_party_contact: truck.third_party_contact || "",
        truck_type: truck.truck_type,
        truck_length: truck.truck_length?.toString() || "",
        carrying_capacity: truck.carrying_capacity?.toString() || "",
        is_active: truck.is_active,
      });
    }
  }, [truck]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        ...formData,
        truck_length: parseFloat(formData.truck_length) || null,
        carrying_capacity: parseFloat(formData.carrying_capacity) || null,
        user_id: user.id,
      };

      if (truck) {
        const { error } = await supabase
          .from("trucks")
          .update(payload)
          .eq("id", truck.id);
        if (error) throw error;
        toast.success("Truck updated successfully");
      } else {
        const { error } = await supabase.from("trucks").insert(payload);
        if (error) throw error;
        toast.success("Truck added successfully");
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="truck_number">Truck Number *</Label>
          <Input
            id="truck_number"
            value={formData.truck_number}
            onChange={(e) => setFormData({ ...formData, truck_number: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="truck_type">Truck Type *</Label>
          <Select
            value={formData.truck_type}
            onValueChange={(value: "open" | "container") =>
              setFormData({ ...formData, truck_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="container">Container</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="driver_name">Driver Name *</Label>
          <Input
            id="driver_name"
            value={formData.driver_name}
            onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="driver_phone">Driver Phone *</Label>
          <Input
            id="driver_phone"
            type="tel"
            value={formData.driver_phone}
            onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="owner_name">Owner Name *</Label>
          <Input
            id="owner_name"
            value={formData.owner_name}
            onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="owner_phone">Owner Phone *</Label>
          <Input
            id="owner_phone"
            type="tel"
            value={formData.owner_phone}
            onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="third_party_contact">3rd Party Contact</Label>
        <Input
          id="third_party_contact"
          type="tel"
          value={formData.third_party_contact}
          onChange={(e) => setFormData({ ...formData, third_party_contact: e.target.value })}
          placeholder="Optional third party contact number"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="truck_length">Truck Length (ft)</Label>
          <Input
            id="truck_length"
            type="number"
            step="0.01"
            value={formData.truck_length}
            onChange={(e) => setFormData({ ...formData, truck_length: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="carrying_capacity">Carrying Capacity (tons)</Label>
          <Input
            id="carrying_capacity"
            type="number"
            step="0.01"
            value={formData.carrying_capacity}
            onChange={(e) => setFormData({ ...formData, carrying_capacity: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : truck ? "Update" : "Add"} Truck
        </Button>
      </div>
    </form>
  );
};

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Load } from "@/pages/Loads";
import { LoadProvider } from "@/pages/LoadProviders";
import { PaymentModelSelector } from "./PaymentModelSelector";

/**
 * @interface LoadFormProps
 * @description The props for the LoadForm component.
 * @property {Load | null} [load] - The load to edit.
 * @property {() => void} onSuccess - The function to call when the form is successfully submitted.
 * @property {() => void} onCancel - The function to call when the form is cancelled.
 */
interface LoadFormProps {
  load?: Load | null;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * @name LoadForm
 * @description A form for creating or editing a load.
 * @param {LoadFormProps} props - The props for the component.
 * @returns {JSX.Element} - The JSX for the component.
 */
export const LoadForm = ({ load, onSuccess, onCancel }: LoadFormProps) => {
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<LoadProvider[]>([]);
  const [formData, setFormData] = useState({
    load_provider_id: "",
    loading_location: "",
    unloading_location: "",
    material_description: "",
    material_weight: "",
    provider_freight: "",
    truck_freight: "",
    status: "pending" as Load["status"],
    payment_model: "standard",
  });

  useEffect(() => {
    fetchProviders();
    if (load) {
      setFormData({
        load_provider_id: load.load_provider_id,
        loading_location: load.loading_location,
        unloading_location: load.unloading_location,
        material_description: load.material_description,
        material_weight: load.material_weight?.toString() || "",
        provider_freight: load.provider_freight?.toString() || "",
        truck_freight: load.truck_freight?.toString() || "",
        status: load.status,
        payment_model: load.payment_model || "standard",
      });
    }
  }, [load]);

  const fetchProviders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("load_providers")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error("Error fetching providers:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        ...formData,
        status: (formData.status || "pending") as "pending" | "assigned" | "in_transit" | "delivered" | "completed",
        material_weight: parseFloat(formData.material_weight),
        provider_freight: parseFloat(formData.provider_freight),
        truck_freight: formData.truck_freight ? parseFloat(formData.truck_freight) : null,
        payment_model: formData.payment_model || "standard",
        user_id: user.id,
      };

      if (load) {
        const { error } = await supabase
          .from("loads")
          .update(payload)
          .eq("id", load.id);
        if (error) throw error;
        toast.success("Load updated successfully");
      } else {
        const { error } = await supabase.from("loads").insert([payload]);
        if (error) throw error;
        toast.success("Load created successfully");
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
      <PaymentModelSelector
        value={formData.payment_model}
        onChange={(value) => setFormData({ ...formData, payment_model: value })}
      />

      <div className="space-y-2">
        <Label htmlFor="load_provider_id">Load Provider *</Label>
        <Select
          value={formData.load_provider_id}
          onValueChange={(value) => setFormData({ ...formData, load_provider_id: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.provider_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="loading_location">Loading Location *</Label>
          <Input
            id="loading_location"
            value={formData.loading_location}
            onChange={(e) => setFormData({ ...formData, loading_location: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unloading_location">Unloading Location *</Label>
          <Input
            id="unloading_location"
            value={formData.unloading_location}
            onChange={(e) => setFormData({ ...formData, unloading_location: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="material_description">Material Description *</Label>
        <Textarea
          id="material_description"
          value={formData.material_description}
          onChange={(e) => setFormData({ ...formData, material_description: e.target.value })}
          required
          rows={2}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="material_weight">Material Weight (tons) *</Label>
          <Input
            id="material_weight"
            type="number"
            step="0.01"
            value={formData.material_weight}
            onChange={(e) => setFormData({ ...formData, material_weight: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="provider_freight">Provider Freight (₹) *</Label>
          <Input
            id="provider_freight"
            type="number"
            step="0.01"
            value={formData.provider_freight}
            onChange={(e) => setFormData({ ...formData, provider_freight: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="truck_freight">Truck Freight (₹)</Label>
          <Input
            id="truck_freight"
            type="number"
            step="0.01"
            value={formData.truck_freight}
            onChange={(e) => setFormData({ ...formData, truck_freight: e.target.value })}
          />
        </div>
      </div>

      {formData.provider_freight && formData.truck_freight && (
        <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
          <p className="text-sm font-medium">
            Profit: ₹
            {(
              parseFloat(formData.provider_freight) - parseFloat(formData.truck_freight)
            ).toLocaleString()}
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : load ? "Update" : "Create"} Load
        </Button>
      </div>
    </form>
  );
};

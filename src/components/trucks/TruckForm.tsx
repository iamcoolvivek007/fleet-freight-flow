import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Truck } from "@/pages/Trucks";
import { Upload, X } from "lucide-react";

interface TruckFormProps {
  truck?: Truck | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const TruckForm = ({ truck, onSuccess, onCancel }: TruckFormProps) => {
  const [loading, setLoading] = useState(false);
  const [truckImage, setTruckImage] = useState<File | null>(null);
  const [driverImage, setDriverImage] = useState<File | null>(null);
  const [truckImagePreview, setTruckImagePreview] = useState<string>("");
  const [driverImagePreview, setDriverImagePreview] = useState<string>("");
  const [formData, setFormData] = useState({
    truck_number: "",
    driver_name: "",
    driver_phone: "",
    owner_name: "",
    owner_phone: "",
    third_party_name: "",
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
        third_party_name: truck.third_party_name || "",
        third_party_contact: truck.third_party_contact || "",
        truck_type: truck.truck_type,
        truck_length: truck.truck_length?.toString() || "",
        carrying_capacity: truck.carrying_capacity?.toString() || "",
        is_active: truck.is_active,
      });
      if (truck.truck_image_url) setTruckImagePreview(truck.truck_image_url);
      if (truck.driver_image_url) setDriverImagePreview(truck.driver_image_url);
    }
  }, [truck]);

  const handleImageChange = (file: File | null, type: 'truck' | 'driver') => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'truck') {
          setTruckImage(file);
          setTruckImagePreview(reader.result as string);
        } else {
          setDriverImage(file);
          setDriverImagePreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Math.random()}.${fileExt}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from('truck-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('truck-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let truckImageUrl = truckImagePreview;
      let driverImageUrl = driverImagePreview;

      // Upload truck image if new file selected
      if (truckImage) {
        const url = await uploadImage(truckImage, 'trucks');
        if (url) truckImageUrl = url;
      }

      // Upload driver image if new file selected
      if (driverImage) {
        const url = await uploadImage(driverImage, 'drivers');
        if (url) driverImageUrl = url;
      }

      const payload = {
        ...formData,
        truck_length: parseFloat(formData.truck_length) || null,
        carrying_capacity: parseFloat(formData.carrying_capacity) || null,
        truck_image_url: truckImageUrl || null,
        driver_image_url: driverImageUrl || null,
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="third_party_name">3rd Party Name (Optional)</Label>
          <Input
            id="third_party_name"
            value={formData.third_party_name}
            onChange={(e) => setFormData({ ...formData, third_party_name: e.target.value })}
            placeholder="Enter 3rd party name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="third_party_contact">3rd Party Contact (Optional)</Label>
          <Input
            id="third_party_contact"
            type="tel"
            value={formData.third_party_contact}
            onChange={(e) => setFormData({ ...formData, third_party_contact: e.target.value })}
            placeholder="Enter 3rd party phone"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Truck Status</Label>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant={formData.is_active ? "default" : "outline"}
            size="sm"
            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
          >
            {formData.is_active ? "Active" : "Inactive"}
          </Button>
          <span className="text-sm text-muted-foreground">
            {formData.is_active 
              ? "This truck can be assigned to loads" 
              : "This truck cannot be assigned to new loads"}
          </span>
        </div>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Truck Picture</Label>
          <div className="flex flex-col gap-2">
            {truckImagePreview && (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                <img src={truckImagePreview} alt="Truck" className="w-full h-full object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => {
                    setTruckImage(null);
                    setTruckImagePreview("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Label htmlFor="truck_image" className="cursor-pointer">
              <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary transition-colors flex items-center justify-center gap-2">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Upload Truck Photo</span>
              </div>
              <Input
                id="truck_image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange(e.target.files?.[0] || null, 'truck')}
              />
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Driver Picture</Label>
          <div className="flex flex-col gap-2">
            {driverImagePreview && (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                <img src={driverImagePreview} alt="Driver" className="w-full h-full object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => {
                    setDriverImage(null);
                    setDriverImagePreview("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Label htmlFor="driver_image" className="cursor-pointer">
              <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary transition-colors flex items-center justify-center gap-2">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Upload Driver Photo</span>
              </div>
              <Input
                id="driver_image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange(e.target.files?.[0] || null, 'driver')}
              />
            </Label>
          </div>
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

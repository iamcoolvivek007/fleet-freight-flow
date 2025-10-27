import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LoadProvider } from "@/pages/LoadProviders";

interface LoadProviderFormProps {
  provider?: LoadProvider | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const LoadProviderForm = ({ provider, onSuccess, onCancel }: LoadProviderFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    provider_name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    is_active: true,
  });

  useEffect(() => {
    if (provider) {
      setFormData({
        provider_name: provider.provider_name,
        contact_person: provider.contact_person || "",
        phone: provider.phone,
        email: provider.email || "",
        address: provider.address || "",
        is_active: provider.is_active,
      });
    }
  }, [provider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        ...formData,
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        address: formData.address || null,
        user_id: user.id,
      };

      if (provider) {
        const { error } = await supabase
          .from("load_providers")
          .update(payload)
          .eq("id", provider.id);
        if (error) throw error;
        toast.success("Provider updated successfully");
      } else {
        const { error } = await supabase.from("load_providers").insert(payload);
        if (error) throw error;
        toast.success("Provider added successfully");
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
      <div className="space-y-2">
        <Label htmlFor="provider_name">Provider Name *</Label>
        <Input
          id="provider_name"
          value={formData.provider_name}
          onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact_person">Contact Person</Label>
          <Input
            id="contact_person"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : provider ? "Update" : "Add"} Provider
        </Button>
      </div>
    </form>
  );
};

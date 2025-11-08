import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LoadProviderForm } from "@/components/load-providers/LoadProviderForm";
import { LoadProvidersList } from "@/components/load-providers/LoadProvidersList";
import { ProviderDetailDialog } from "@/components/load-providers/ProviderDetailDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * @interface LoadProvider
 * @description The load provider interface.
 * @property {string} id - The provider ID.
 * @property {string} provider_name - The provider name.
 * @property {string | null} contact_person - The contact person.
 * @property {string} phone - The phone number.
 * @property {string | null} email - The email address.
 * @property {string | null} address - The address.
 * @property {boolean} is_active - Whether the provider is active.
 */
export interface LoadProvider {
  id: string;
  provider_name: string;
  contact_person: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  is_active: boolean;
}

/**
 * @name LoadProviders
 * @description The load providers page.
 * @returns {JSX.Element} - The JSX for the component.
 */
const LoadProviders = () => {
  const [providers, setProviders] = useState<LoadProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<LoadProvider | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<LoadProvider | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("load_providers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (provider: LoadProvider) => {
    setEditingProvider(provider);
    setDialogOpen(true);
  };

  const handleViewDetails = (provider: LoadProvider) => {
    setSelectedProvider(provider);
    setDetailDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProvider(null);
  };

  const handleSuccess = () => {
    fetchProviders();
    handleCloseDialog();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Load Providers</h1>
          <p className="text-muted-foreground">
            Manage your load provider clients
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Provider
        </Button>
      </div>

      <LoadProvidersList 
        providers={providers} 
        loading={loading} 
        onEdit={handleEdit}
        onViewDetails={handleViewDetails}
        onRefresh={fetchProviders}
      />

      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? "Edit Load Provider" : "Add New Load Provider"}
            </DialogTitle>
          </DialogHeader>
          <LoadProviderForm 
            provider={editingProvider} 
            onSuccess={handleSuccess}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      <ProviderDetailDialog
        provider={selectedProvider}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
};

export default LoadProviders;

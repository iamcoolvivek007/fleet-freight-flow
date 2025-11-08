import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, DollarSign, TrendingDown } from "lucide-react";
import { QuickPaymentDialog } from "./QuickPaymentDialog";

/**
 * @interface ProviderOutstanding
 * @description The provider outstanding interface.
 * @property {string} id - The provider ID.
 * @property {string} provider_name - The provider name.
 * @property {number} totalFreight - The total freight.
 * @property {number} totalReceived - The total received.
 * @property {number} outstanding - The outstanding balance.
 * @property {number} loadCount - The load count.
 */
interface ProviderOutstanding {
  id: string;
  provider_name: string;
  totalFreight: number;
  totalReceived: number;
  outstanding: number;
  loadCount: number;
}

/**
 * @name TopProvidersWidget
 * @description A widget to display the top providers with outstanding balances.
 * @returns {JSX.Element} - The JSX for the component.
 */
export const TopProvidersWidget = () => {
  const [providers, setProviders] = useState<ProviderOutstanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderOutstanding | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  useEffect(() => {
    fetchTopProviders();
  }, []);

  const fetchTopProviders = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all providers
      const { data: providersData, error: providersError } = await supabase
        .from("load_providers")
        .select("id, provider_name")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (providersError) throw providersError;

      if (!providersData || providersData.length === 0) {
        setProviders([]);
        return;
      }

      // Fetch all loads with their transactions
      const providerStats: ProviderOutstanding[] = await Promise.all(
        providersData.map(async (provider) => {
          // Get all loads for this provider
          const { data: loads, error: loadsError } = await supabase
            .from("loads")
            .select(`
              id,
              provider_freight,
              load_assignments!inner(
                id,
                transactions(amount, transaction_type)
              )
            `)
            .eq("user_id", user.id)
            .eq("load_provider_id", provider.id);

          if (loadsError) throw loadsError;

          // Calculate totals
          let totalFreight = 0;
          let totalReceived = 0;

          loads?.forEach((load: any) => {
            totalFreight += parseFloat(load.provider_freight?.toString() || "0");

            // Sum all payments from provider
            load.load_assignments?.forEach((assignment: any) => {
              assignment.transactions?.forEach((trans: any) => {
                if (
                  trans.transaction_type === "advance_from_provider" ||
                  trans.transaction_type === "balance_from_provider"
                ) {
                  totalReceived += parseFloat(trans.amount?.toString() || "0");
                }
              });
            });
          });

          const outstanding = totalFreight - totalReceived;

          return {
            id: provider.id,
            provider_name: provider.provider_name,
            totalFreight,
            totalReceived,
            outstanding,
            loadCount: loads?.length || 0,
          };
        })
      );

      // Filter providers with outstanding balance > 0 and sort by outstanding (highest first)
      const sortedProviders = providerStats
        .filter((p) => p.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding)
        .slice(0, 5);

      setProviders(sortedProviders);
    } catch (error) {
      console.error("Error fetching top providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    fetchTopProviders();
    setPaymentDialogOpen(false);
    setSelectedProvider(null);
  };

  const handleQuickPayment = (provider: ProviderOutstanding) => {
    setSelectedProvider(provider);
    setPaymentDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Top Outstanding Providers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (providers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-success" />
            Outstanding Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <DollarSign className="h-12 w-12 text-success mb-3" />
            <p className="text-lg font-semibold text-success">All Caught Up!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No outstanding payments from providers
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Top Outstanding Providers
            </CardTitle>
            <Badge variant="destructive" className="text-xs">
              {providers.length} pending
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Providers with highest outstanding balances
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {providers.map((provider, index) => (
            <div
              key={provider.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10 text-destructive font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{provider.provider_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{provider.loadCount} loads</span>
                    <span>•</span>
                    <span>₹{provider.totalReceived.toLocaleString()} / ₹{provider.totalFreight.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-bold text-destructive">
                    ₹{provider.outstanding.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">outstanding</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleQuickPayment(provider)}
                  className="ml-2"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Pay
                </Button>
              </div>
            </div>
          ))}

          {providers.length > 0 && (
            <div className="flex items-center justify-between pt-3 border-t">
              <p className="text-sm font-semibold">Total Outstanding</p>
              <p className="text-lg font-bold text-destructive">
                ₹{providers.reduce((sum, p) => sum + p.outstanding, 0).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedProvider && (
        <QuickPaymentDialog
          provider={selectedProvider}
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

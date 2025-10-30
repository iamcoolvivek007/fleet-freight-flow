import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";

interface PartyBalance {
  provider_id: string;
  provider_name: string;
  total_freight: number;
  total_received: number;
  balance: number;
  load_count: number;
}

export const PartyBalanceSheet = () => {
  const [loading, setLoading] = useState(true);
  const [partyBalances, setPartyBalances] = useState<PartyBalance[]>([]);

  useEffect(() => {
    fetchPartyBalances();
  }, []);

  const fetchPartyBalances = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all loads with provider info
      const { data: loads, error: loadsError } = await supabase
        .from("loads")
        .select("id, load_provider_id, provider_freight")
        .eq("user_id", user.id);

      if (loadsError) throw loadsError;

      // Fetch all load assignments
      const { data: assignments } = await supabase
        .from("load_assignments")
        .select("id, load_id")
        .eq("user_id", user.id);

      // Fetch all transactions from providers
      const { data: transactions } = await supabase
        .from("transactions")
        .select("load_assignment_id, amount, transaction_type")
        .eq("user_id", user.id)
        .in("transaction_type", ["advance_from_provider", "balance_from_provider"]);

      // Fetch providers
      const { data: providers } = await supabase
        .from("load_providers")
        .select("id, provider_name")
        .eq("user_id", user.id);

      // Calculate balances per provider
      const balanceMap = new Map<string, PartyBalance>();

      loads?.forEach((load) => {
        const provider = providers?.find((p) => p.id === load.load_provider_id);
        if (!provider) return;

        const assignment = assignments?.find((a) => a.load_id === load.id);
        const received = transactions
          ?.filter((t) => t.load_assignment_id === assignment?.id)
          .reduce((sum, t) => sum + parseFloat(t.amount?.toString() || "0"), 0) || 0;

        const existing = balanceMap.get(provider.id);
        if (existing) {
          existing.total_freight += parseFloat(load.provider_freight?.toString() || "0");
          existing.total_received += received;
          existing.balance = existing.total_freight - existing.total_received;
          existing.load_count += 1;
        } else {
          const freight = parseFloat(load.provider_freight?.toString() || "0");
          balanceMap.set(provider.id, {
            provider_id: provider.id,
            provider_name: provider.provider_name,
            total_freight: freight,
            total_received: received,
            balance: freight - received,
            load_count: 1,
          });
        }
      });

      setPartyBalances(Array.from(balanceMap.values()));
    } catch (error) {
      console.error("Error fetching party balances:", error);
      toast.error("Failed to fetch party balances");
    } finally {
      setLoading(false);
    }
  };

  const downloadBalanceSheet = (party: PartyBalance) => {
    const content = `
BALANCE SHEET - ${party.provider_name}
${"=".repeat(50)}

Total Freight: ₹${party.total_freight.toLocaleString()}
Total Received: ₹${party.total_received.toLocaleString()}
Balance Due: ₹${party.balance.toLocaleString()}
Number of Loads: ${party.load_count}

Generated on: ${new Date().toLocaleDateString()}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${party.provider_name}_balance_sheet.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Balance sheet downloaded");
  };

  const shareBalanceSheet = (party: PartyBalance) => {
    const text = `Balance Sheet - ${party.provider_name}\nTotal: ₹${party.total_freight.toLocaleString()}\nReceived: ₹${party.total_received.toLocaleString()}\nBalance: ₹${party.balance.toLocaleString()}`;
    
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Balance copied to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (partyBalances.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No party balances found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {partyBalances.map((party) => (
        <Card key={party.provider_id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{party.provider_name}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadBalanceSheet(party)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => shareBalanceSheet(party)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Freight</p>
                <p className="text-lg font-semibold">
                  ₹{party.total_freight.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Received</p>
                <p className="text-lg font-semibold text-success">
                  ₹{party.total_received.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance Due</p>
                <p
                  className={`text-lg font-semibold ${
                    party.balance > 0 ? "text-warning" : "text-success"
                  }`}
                >
                  ₹{party.balance.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Loads</p>
                <p className="text-lg font-semibold">{party.load_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

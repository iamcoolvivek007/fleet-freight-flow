import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Truck as TruckIcon } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface DriverBalance {
  truck_id: string;
  truck_number: string;
  driver_name: string;
  driver_phone: string;
  total_freight: number;
  total_paid: number;
  balance: number;
  load_count: number;
}

export const DriverBalanceSheet = () => {
  const [loading, setLoading] = useState(true);
  const [driverBalances, setDriverBalances] = useState<DriverBalance[]>([]);

  useEffect(() => {
    fetchDriverBalances();
  }, []);

  const fetchDriverBalances = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all load assignments with truck details
      const { data: assignments, error: assignmentsError } = await supabase
        .from("load_assignments")
        .select(`
          *,
          loads!inner(truck_freight),
          trucks!inner(truck_number, driver_name, driver_phone)
        `)
        .eq("user_id", user.id);

      if (assignmentsError) throw assignmentsError;

      // Fetch all transactions for drivers
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .in("transaction_type", ["balance_to_driver", "advance_to_driver"]);

      if (transactionsError) throw transactionsError;

      // Calculate balances per driver/truck
      const balanceMap = new Map<string, DriverBalance>();

      assignments?.forEach((assignment: any) => {
        const truckId = assignment.truck_id;
        const truckFreight = assignment.loads?.truck_freight || 0;

        if (!balanceMap.has(truckId)) {
          balanceMap.set(truckId, {
            truck_id: truckId,
            truck_number: assignment.trucks?.truck_number || "",
            driver_name: assignment.trucks?.driver_name || "",
            driver_phone: assignment.trucks?.driver_phone || "",
            total_freight: 0,
            total_paid: 0,
            balance: 0,
            load_count: 0,
          });
        }

        const balance = balanceMap.get(truckId)!;
        balance.total_freight += Number(truckFreight);
        balance.load_count += 1;
      });

      // Calculate payments
      transactions?.forEach((transaction: any) => {
        const loadAssignment = assignments?.find(
          (a: any) => a.id === transaction.load_assignment_id
        );
        if (loadAssignment) {
          const balance = balanceMap.get(loadAssignment.truck_id);
          if (balance) {
            balance.total_paid += Number(transaction.amount);
          }
        }
      });

      // Calculate final balance
      balanceMap.forEach((balance) => {
        balance.balance = balance.total_freight - balance.total_paid;
      });

      setDriverBalances(Array.from(balanceMap.values()).filter(b => b.load_count > 0));
    } catch (error: any) {
      console.error("Error fetching driver balances:", error);
      toast.error("Failed to fetch driver balances");
    } finally {
      setLoading(false);
    }
  };

  const downloadBalanceSheet = (driver: DriverBalance) => {
    const content = `
DRIVER BALANCE SHEET
==================

Truck Number: ${driver.truck_number}
Driver Name: ${driver.driver_name}
Driver Phone: ${driver.driver_phone}

Financial Summary:
-----------------
Total Loads: ${driver.load_count}
Total Freight: ₹${driver.total_freight.toFixed(2)}
Total Paid: ₹${driver.total_paid.toFixed(2)}
Balance Due: ₹${driver.balance.toFixed(2)}

Generated: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `driver-balance-${driver.truck_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareBalanceSheet = async (driver: DriverBalance) => {
    const text = `Driver Balance - ${driver.driver_name}\nTruck: ${driver.truck_number}\nTotal Freight: ₹${driver.total_freight}\nPaid: ₹${driver.total_paid}\nBalance: ₹${driver.balance}`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Balance copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (driverBalances.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TruckIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No driver balances found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {driverBalances.map((driver) => (
        <Card key={driver.truck_id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{driver.driver_name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Truck: {driver.truck_number} • {driver.driver_phone}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadBalanceSheet(driver)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareBalanceSheet(driver)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Loads</p>
                <p className="text-2xl font-bold">{driver.load_count}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Freight</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{driver.total_freight.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{driver.total_paid.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance Due</p>
                <p className={`text-2xl font-bold ${driver.balance > 0 ? "text-amber-600" : "text-green-600"}`}>
                  ₹{driver.balance.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

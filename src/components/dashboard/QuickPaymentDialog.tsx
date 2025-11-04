import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProviderOutstanding {
  id: string;
  provider_name: string;
  outstanding: number;
}

interface Load {
  id: string;
  loading_location: string;
  unloading_location: string;
  provider_freight: number;
  assignment_id: string;
  received: number;
  remaining: number;
}

interface QuickPaymentDialogProps {
  provider: ProviderOutstanding;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const QuickPaymentDialog = ({ provider, open, onOpenChange, onSuccess }: QuickPaymentDialogProps) => {
  const [loads, setLoads] = useState<Load[]>([]);
  const [selectedLoadId, setSelectedLoadId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingLoads, setFetchingLoads] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProviderLoads();
    }
  }, [open, provider.id]);

  const fetchProviderLoads = async () => {
    setFetchingLoads(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch loads with outstanding balance
      const { data: loadsData, error: loadsError } = await supabase
        .from("loads")
        .select(`
          id,
          loading_location,
          unloading_location,
          provider_freight,
          load_assignments!inner(
            id,
            transactions(amount, transaction_type)
          )
        `)
        .eq("user_id", user.id)
        .eq("load_provider_id", provider.id)
        .neq("status", "completed");

      if (loadsError) throw loadsError;

      const processedLoads: Load[] = [];
      loadsData?.forEach((load: any) => {
        const freight = parseFloat(load.provider_freight?.toString() || "0");
        
        // Calculate received for this load
        let received = 0;
        load.load_assignments?.forEach((assignment: any) => {
          assignment.transactions?.forEach((trans: any) => {
            if (
              trans.transaction_type === "advance_from_provider" ||
              trans.transaction_type === "balance_from_provider"
            ) {
              received += parseFloat(trans.amount?.toString() || "0");
            }
          });
        });

        const remaining = freight - received;
        
        // Only include loads with outstanding balance
        if (remaining > 0 && load.load_assignments?.[0]) {
          processedLoads.push({
            id: load.id,
            loading_location: load.loading_location,
            unloading_location: load.unloading_location,
            provider_freight: freight,
            assignment_id: load.load_assignments[0].id,
            received,
            remaining,
          });
        }
      });

      setLoads(processedLoads);
      
      // Auto-select first load if available
      if (processedLoads.length > 0) {
        setSelectedLoadId(processedLoads[0].id);
        setAmount(processedLoads[0].remaining.toString());
      }
    } catch (error) {
      console.error("Error fetching provider loads:", error);
      toast.error("Failed to load provider's loads");
    } finally {
      setFetchingLoads(false);
    }
  };

  const handleLoadChange = (loadId: string) => {
    setSelectedLoadId(loadId);
    const load = loads.find(l => l.id === loadId);
    if (load) {
      setAmount(load.remaining.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLoadId) {
      toast.error("Please select a load");
      return;
    }

    const selectedLoad = loads.find(l => l.id === selectedLoadId);
    if (!selectedLoad) {
      toast.error("Invalid load selected");
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (paymentAmount > selectedLoad.remaining) {
      toast.error(`Amount cannot exceed outstanding balance of ₹${selectedLoad.remaining.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Determine transaction type based on whether advance was already paid
      const transactionType = selectedLoad.received > 0 ? "balance_from_provider" : "advance_from_provider";

      const { error } = await supabase.from("transactions").insert([{
        user_id: user.id,
        load_assignment_id: selectedLoad.assignment_id,
        transaction_type: transactionType as any,
        amount: paymentAmount,
        transaction_date: date.toISOString(),
        payment_method: paymentMethod as any,
        payment_details: paymentDetails || null,
        notes: notes || null,
      }]);

      if (error) throw error;

      toast.success(`Payment of ₹${paymentAmount.toLocaleString()} recorded successfully`);
      onSuccess();
    } catch (error: any) {
      console.error("Error recording payment:", error);
      toast.error(error.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const selectedLoad = loads.find(l => l.id === selectedLoadId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick Payment - {provider.provider_name}</DialogTitle>
        </DialogHeader>

        {fetchingLoads ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : loads.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No loads with outstanding balance found</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="load">Select Load</Label>
              <Select value={selectedLoadId} onValueChange={handleLoadChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {loads.map((load) => (
                    <SelectItem key={load.id} value={load.id}>
                      {load.loading_location} → {load.unloading_location} (₹{load.remaining.toLocaleString()} due)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedLoad && (
                <p className="text-xs text-muted-foreground">
                  Freight: ₹{selectedLoad.provider_freight.toLocaleString()} • 
                  Received: ₹{selectedLoad.received.toLocaleString()} • 
                  Outstanding: ₹{selectedLoad.remaining.toLocaleString()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-details">Payment Details</Label>
              <Input
                id="payment-details"
                placeholder="Transaction ID, Reference number, etc."
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  `Record ₹${amount || "0"}`
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

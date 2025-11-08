import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadProvider } from "@/pages/LoadProviders";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { User, Phone, Mail, MapPin, TrendingUp, DollarSign, AlertCircle, ChevronDown, Calendar } from "lucide-react";
import { format } from "date-fns";

/**
 * @interface LoadData
 * @description The load data interface.
 * @property {string} id - The load ID.
 * @property {string} loading_location - The loading location.
 * @property {string} unloading_location - The unloading location.
 * @property {string} material_description - The material description.
 * @property {string} status - The load status.
 * @property {number} provider_freight - The provider freight.
 * @property {string} created_at - The creation date.
 * @property {object} [assignment] - The assignment object.
 * @property {string} assignment.id - The assignment ID.
 * @property {object} assignment.truck - The truck object.
 * @property {string} assignment.truck.truck_number - The truck number.
 */
interface LoadData {
  id: string;
  loading_location: string;
  unloading_location: string;
  material_description: string;
  status: string;
  provider_freight: number;
  created_at: string;
  assignment?: {
    id: string;
    truck: {
      truck_number: string;
    };
  };
}

/**
 * @interface Transaction
 * @description The transaction interface.
 * @property {string} id - The transaction ID.
 * @property {number} amount - The transaction amount.
 * @property {string} transaction_type - The transaction type.
 * @property {string} payment_method - The payment method.
 * @property {string} transaction_date - The transaction date.
 * @property {string} [payment_details] - The payment details.
 */
interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  payment_method: string;
  transaction_date: string;
  payment_details?: string;
}

/**
 * @interface ProviderDetailDialogProps
 * @description The props for the ProviderDetailDialog component.
 * @property {LoadProvider | null} provider - The provider.
 * @property {boolean} open - Whether the dialog is open.
 * @property {(open: boolean) => void} onOpenChange - The function to call when the dialog is opened or closed.
 */
interface ProviderDetailDialogProps {
  provider: LoadProvider | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * @name ProviderDetailDialog
 * @description A dialog to display the details of a provider.
 * @param {ProviderDetailDialogProps} props - The props for the component.
 * @returns {JSX.Element | null} - The JSX for the component.
 */
export const ProviderDetailDialog = ({ provider, open, onOpenChange }: ProviderDetailDialogProps) => {
  const [loads, setLoads] = useState<LoadData[]>([]);
  const [transactions, setTransactions] = useState<Record<string, Transaction[]>>({});
  const [expandedLoads, setExpandedLoads] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const [summary, setSummary] = useState({
    totalLoads: 0,
    totalFreight: 0,
    totalReceived: 0,
    outstanding: 0,
  });

  useEffect(() => {
    if (open && provider) {
      fetchProviderLoads();
    }
  }, [open, provider?.id, statusFilter]);

  const fetchProviderLoads = async () => {
    if (!provider) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Build query with status filter
      let query = supabase
        .from("loads")
        .select(`
          *,
          load_assignments!inner(
            id,
            trucks!inner(truck_number)
          )
        `)
        .eq("user_id", user.id)
        .eq("load_provider_id", provider.id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data: loadsData, error: loadsError } = await query;

      if (loadsError) throw loadsError;

      const formattedLoads = loadsData?.map((load: any) => ({
        id: load.id,
        loading_location: load.loading_location,
        unloading_location: load.unloading_location,
        material_description: load.material_description,
        status: load.status,
        provider_freight: load.provider_freight,
        created_at: load.created_at,
        assignment: load.load_assignments?.[0] ? {
          id: load.load_assignments[0].id,
          truck: {
            truck_number: load.load_assignments[0].trucks?.truck_number || "N/A"
          }
        } : undefined
      })) || [];

      setLoads(formattedLoads);

      // Fetch transactions for all loads
      if (formattedLoads.length > 0) {
        const assignmentIds = formattedLoads
          .filter(l => l.assignment)
          .map(l => l.assignment!.id);

        if (assignmentIds.length > 0) {
          const { data: transactionsData, error: transError } = await supabase
            .from("transactions")
            .select("*")
            .in("load_assignment_id", assignmentIds)
            .in("transaction_type", ["advance_from_provider", "balance_from_provider"])
            .order("transaction_date", { ascending: true });

          if (transError) throw transError;

          // Group transactions by assignment ID
          const transMap: Record<string, Transaction[]> = {};
          transactionsData?.forEach((trans: any) => {
            if (!transMap[trans.load_assignment_id]) {
              transMap[trans.load_assignment_id] = [];
            }
            transMap[trans.load_assignment_id].push(trans);
          });
          setTransactions(transMap);

          // Calculate summary
          const totalFreight = formattedLoads.reduce((sum, l) => sum + (l.provider_freight || 0), 0);
          const totalReceived = Object.values(transMap)
            .flat()
            .reduce((sum, t) => sum + parseFloat(t.amount?.toString() || "0"), 0);

          setSummary({
            totalLoads: formattedLoads.length,
            totalFreight,
            totalReceived,
            outstanding: totalFreight - totalReceived,
          });
        }
      } else {
        setTransactions({});
        setSummary({
          totalLoads: 0,
          totalFreight: 0,
          totalReceived: 0,
          outstanding: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching provider loads:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLoadExpansion = (loadId: string) => {
    const newExpanded = new Set(expandedLoads);
    if (newExpanded.has(loadId)) {
      newExpanded.delete(loadId);
    } else {
      newExpanded.add(loadId);
    }
    setExpandedLoads(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "delivered": return "secondary";
      case "in_transit": return "outline";
      default: return "secondary";
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case "cash": return <Badge variant="outline" className="text-xs">Cash</Badge>;
      case "upi": return <Badge variant="outline" className="text-xs">UPI</Badge>;
      case "bank_transfer": return <Badge variant="outline" className="text-xs">Bank</Badge>;
      default: return <Badge variant="outline" className="text-xs">{method}</Badge>;
    }
  };

  if (!provider) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Provider Details & Load History</DialogTitle>
        </DialogHeader>

        {/* Provider Info Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{provider.provider_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              {provider.contact_person && (
                <div className="flex items-center text-sm">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{provider.contact_person}</span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{provider.phone}</span>
              </div>
              {provider.email && (
                <div className="flex items-center text-sm">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{provider.email}</span>
                </div>
              )}
              {provider.address && (
                <div className="flex items-center text-sm">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{provider.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Loads</p>
                  <p className="text-2xl font-bold">{summary.totalLoads}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Freight</p>
                  <p className="text-2xl font-bold">₹{summary.totalFreight.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Received</p>
                  <p className="text-2xl font-bold text-success">₹{summary.totalReceived.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-2xl font-bold text-destructive">₹{summary.outstanding.toLocaleString()}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter by Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Loads</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loads List */}
        <div className="space-y-3">
          {loading ? (
            <>
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </>
          ) : loads.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No loads found for this provider</p>
              </CardContent>
            </Card>
          ) : (
            loads.map((load) => {
              const loadTransactions = load.assignment ? transactions[load.assignment.id] || [] : [];
              const received = loadTransactions.reduce(
                (sum, t) => sum + parseFloat(t.amount?.toString() || "0"),
                0
              );
              const outstanding = (load.provider_freight || 0) - received;
              const isExpanded = expandedLoads.has(load.id);

              return (
                <Card key={load.id}>
                  <CardContent className="pt-4 space-y-3">
                    {/* Load Summary Row */}
                    <div className="grid grid-cols-7 gap-4 items-center">
                      <div className="col-span-1">
                        <p className="text-xs text-muted-foreground">Load ID</p>
                        <p className="text-sm font-mono">#{load.id.substring(0, 8)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Route</p>
                        <p className="text-sm font-medium">
                          {load.loading_location} → {load.unloading_location}
                        </p>
                      </div>
                      <div className="col-span-1">
                        <p className="text-xs text-muted-foreground">Truck</p>
                        <p className="text-sm">{load.assignment?.truck.truck_number || "N/A"}</p>
                      </div>
                      <div className="col-span-1 text-center">
                        <Badge variant={getStatusColor(load.status)}>{load.status}</Badge>
                      </div>
                      <div className="col-span-1 text-right">
                        <p className="text-xs text-muted-foreground">Freight</p>
                        <p className="text-sm font-bold">₹{load.provider_freight?.toLocaleString()}</p>
                        <p className="text-xs text-success">₹{received.toLocaleString()} paid</p>
                        {outstanding > 0 && (
                          <p className="text-xs text-destructive">₹{outstanding.toLocaleString()} due</p>
                        )}
                      </div>
                      <div className="col-span-1 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLoadExpansion(load.id)}
                          disabled={loadTransactions.length === 0}
                        >
                          {loadTransactions.length > 0 ? (
                            <>
                              View Transactions
                              <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </>
                          ) : (
                            "No Transactions"
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Transaction Details */}
                    {isExpanded && loadTransactions.length > 0 && (
                      <div className="border-t pt-3 space-y-2">
                        <p className="text-sm font-semibold">Transaction History</p>
                        {loadTransactions.map((trans) => (
                          <div
                            key={trans.id}
                            className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                          >
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">
                                  {trans.transaction_type === "advance_from_provider"
                                    ? "Advance Payment"
                                    : "Balance Payment"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(trans.transaction_date), "MMM dd, yyyy")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {getPaymentMethodBadge(trans.payment_method)}
                              <p className="text-sm font-bold">₹{parseFloat(trans.amount?.toString() || "0").toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-2 border-t">
                          <p className="text-sm font-semibold">Total Received:</p>
                          <p className="text-lg font-bold text-success">
                            ₹{received.toLocaleString()} / ₹{load.provider_freight?.toLocaleString()}
                            <span className="text-sm text-muted-foreground ml-2">
                              ({((received / (load.provider_freight || 1)) * 100).toFixed(0)}%)
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Package, Download, FileText, Users, Truck, Calendar } from "lucide-react";
import { PartyBalanceSheet } from "@/components/reports/PartyBalanceSheet";
import { DriverBalanceSheet } from "@/components/reports/DriverBalanceSheet";
import { DailyLoadReport } from "@/components/reports/DailyLoadReport";
import { toast } from "sonner";

interface ReportData {
  totalRevenue: number;
  totalProfit: number;
  totalLoads: number;
  completedLoads: number;
  avgProfit: number;
  totalExpenses: number;
  totalReceivables: number;
  totalPayables: number;
  cashInHand: number;
}

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case "daily":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "weekly":
          startDate.setDate(now.getDate() - 7);
          break;
        case "monthly":
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      const [loadsRes, transactionsRes, expensesRes, assignmentsRes] = await Promise.all([
        supabase
          .from("loads")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", startDate.toISOString()),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .gte("transaction_date", startDate.toISOString()),
        supabase
          .from("expenses")
          .select("*")
          .eq("user_id", user.id)
          .gte("payment_date", startDate.toISOString()),
        supabase
          .from("load_assignments")
          .select("*")
          .eq("user_id", user.id),
      ]);

      const totalRevenue =
        transactionsRes.data
          ?.filter((t) => t.transaction_type?.includes("from_provider"))
          .reduce((sum, t) => sum + parseFloat(t.amount?.toString() || "0"), 0) || 0;

      const totalExpenses =
        expensesRes.data?.reduce(
          (sum, e) => sum + parseFloat(e.amount?.toString() || "0"),
          0
        ) || 0;

      const totalProfit =
        loadsRes.data?.reduce(
          (sum, l) => sum + parseFloat(l.profit?.toString() || "0"),
          0
        ) || 0;

      const completedLoads =
        loadsRes.data?.filter((l) => l.status === "completed").length || 0;

      // Calculate receivables and payables
      const totalFreight = loadsRes.data?.reduce(
        (sum, l) => sum + parseFloat(l.provider_freight?.toString() || "0"),
        0
      ) || 0;

      const totalTruckCost = loadsRes.data?.reduce(
        (sum, l) => sum + parseFloat(l.truck_freight?.toString() || "0"),
        0
      ) || 0;

      const totalPaidToDrivers =
        transactionsRes.data
          ?.filter((t) => t.transaction_type?.includes("to_driver"))
          .reduce((sum, t) => sum + parseFloat(t.amount?.toString() || "0"), 0) || 0;

      const totalReceivables = totalFreight - totalRevenue;
      const totalPayables = totalTruckCost - totalPaidToDrivers;
      const cashInHand = totalRevenue - totalPaidToDrivers - totalExpenses;

      setReportData({
        totalRevenue,
        totalProfit,
        totalLoads: loadsRes.data?.length || 0,
        completedLoads,
        avgProfit: completedLoads > 0 ? totalProfit / completedLoads : 0,
        totalExpenses,
        totalReceivables,
        totalPayables,
        cashInHand,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
  }: {
    title: string;
    value: string;
    icon: any;
    color: string;
    subtitle?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights
          </p>
        </div>
        <Select
          value={period}
          onValueChange={(value: "daily" | "weekly" | "monthly") =>
            setPeriod(value)
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <FileText className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="daily">
            <Calendar className="h-4 w-4 mr-2" />
            Daily Report
          </TabsTrigger>
          <TabsTrigger value="party">
            <Users className="h-4 w-4 mr-2" />
            Party Balance
          </TabsTrigger>
          <TabsTrigger value="supplier">
            <Truck className="h-4 w-4 mr-2" />
            Driver Balance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Revenue"
              value={`₹${reportData?.totalRevenue.toLocaleString() || 0}`}
              icon={DollarSign}
              color="bg-success/10 text-success"
              subtitle="Received from parties"
            />
            <StatCard
              title="Total Expenses"
              value={`₹${reportData?.totalExpenses.toLocaleString() || 0}`}
              icon={TrendingUp}
              color="bg-warning/10 text-warning"
              subtitle="All trip expenses"
            />
            <StatCard
              title="Net Profit"
              value={`₹${reportData?.totalProfit.toLocaleString() || 0}`}
              icon={TrendingUp}
              color="bg-success/10 text-success"
              subtitle={`Avg: ₹${reportData?.avgProfit.toLocaleString() || 0}/load`}
            />
            <StatCard
              title="Total Loads"
              value={reportData?.totalLoads.toString() || "0"}
              icon={Package}
              color="bg-primary/10 text-primary"
              subtitle={`${reportData?.completedLoads || 0} completed`}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Outstanding Receivables"
              value={`₹${reportData?.totalReceivables.toLocaleString() || 0}`}
              icon={TrendingUp}
              color="bg-amber-500/10 text-amber-500"
              subtitle="Balance from parties"
            />
            <StatCard
              title="Outstanding Payables"
              value={`₹${reportData?.totalPayables.toLocaleString() || 0}`}
              icon={DollarSign}
              color="bg-blue-500/10 text-blue-500"
              subtitle="Balance to drivers"
            />
            <StatCard
              title="Cash in Hand"
              value={`₹${reportData?.cashInHand.toLocaleString() || 0}`}
              icon={DollarSign}
              color="bg-primary/10 text-primary"
              subtitle="Current balance"
            />
            <StatCard
              title="Success Rate"
              value={
                reportData?.totalLoads
                  ? `${Math.round(
                      (reportData.completedLoads / reportData.totalLoads) * 100
                    )}%`
                  : "0%"
              }
              icon={TrendingUp}
              color="bg-success/10 text-success"
              subtitle="Completion rate"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Profit & Loss Summary</span>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Total Revenue</span>
                <span className="font-semibold text-success">
                  + ₹{reportData?.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Total Expenses</span>
                <span className="font-semibold text-warning">
                  - ₹{reportData?.totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Driver Payments</span>
                <span className="font-semibold text-blue-500">
                  - ₹{reportData?.totalPayables.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold">Net Profit</span>
                <span className="font-bold text-xl text-success">
                  ₹{reportData?.totalProfit.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily">
          <DailyLoadReport />
        </TabsContent>

        <TabsContent value="party">
          <PartyBalanceSheet />
        </TabsContent>

        <TabsContent value="supplier">
          <DriverBalanceSheet />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;

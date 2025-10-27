import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, DollarSign, Package, Truck } from "lucide-react";

interface ReportData {
  totalRevenue: number;
  totalProfit: number;
  totalLoads: number;
  completedLoads: number;
  avgProfit: number;
}

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate date range based on period
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

      const [loadsRes, transactionsRes] = await Promise.all([
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
      ]);

      const totalRevenue =
        transactionsRes.data
          ?.filter((t) => t.transaction_type?.includes("from_provider"))
          .reduce((sum, t) => sum + parseFloat(t.amount?.toString() || "0"), 0) || 0;

      const totalProfit =
        loadsRes.data?.reduce(
          (sum, l) => sum + parseFloat(l.profit?.toString() || "0"),
          0
        ) || 0;

      const completedLoads =
        loadsRes.data?.filter((l) => l.status === "completed").length || 0;

      setReportData({
        totalRevenue,
        totalProfit,
        totalLoads: loadsRes.data?.length || 0,
        completedLoads,
        avgProfit: completedLoads > 0 ? totalProfit / completedLoads : 0,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string;
    icon: any;
    color: string;
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
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Performance analytics and insights
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`₹${reportData?.totalRevenue.toLocaleString() || 0}`}
          icon={DollarSign}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          title="Total Profit"
          value={`₹${reportData?.totalProfit.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="bg-success/10 text-success"
        />
        <StatCard
          title="Total Loads"
          value={reportData?.totalLoads.toString() || "0"}
          icon={Package}
          color="bg-accent/10 text-accent"
        />
        <StatCard
          title="Avg Profit/Load"
          value={`₹${reportData?.avgProfit.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="bg-warning/10 text-warning"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-muted-foreground">Completed Loads</span>
            <span className="font-semibold">{reportData?.completedLoads}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-muted-foreground">Pending Loads</span>
            <span className="font-semibold">
              {(reportData?.totalLoads || 0) - (reportData?.completedLoads || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Success Rate</span>
            <span className="font-semibold text-success">
              {reportData?.totalLoads
                ? Math.round(
                    (reportData.completedLoads / reportData.totalLoads) * 100
                  )
                : 0}
              %
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;

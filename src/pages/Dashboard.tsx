import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Package, DollarSign, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CashFlowByMethod } from "@/components/dashboard/CashFlowByMethod";
import { TopProvidersWidget } from "@/components/dashboard/TopProvidersWidget";
import { getCashBalanceByMethod } from "@/lib/financialCalculations";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalTrucks: number;
  activeTrucks: number;
  assignedTrucks: number;
  totalLoads: number;
  activeLoads: number;
  totalRevenue: number;
  totalProfit: number;
  pendingTransactions: number;
  cashBalance: number;
  upiBalance: number;
  bankBalance: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [trucksRes, loadsRes, transactionsRes, expensesRes] = await Promise.all([
        supabase.from("trucks").select("*", { count: "exact" }).eq("user_id", user.id),
        supabase.from("loads").select("*", { count: "exact" }).eq("user_id", user.id),
        supabase.from("transactions").select("*").eq("user_id", user.id),
        supabase.from("expenses").select("*").eq("user_id", user.id),
      ]);

      const activeTrucks = trucksRes.data?.filter((t) => t.is_active).length || 0;
      const assignedTrucks = trucksRes.data?.filter(
        (t) => !t.is_active && t.inactive_reason === 'assigned_to_load'
      ).length || 0;
      
      const activeLoads = loadsRes.data?.filter((l) => 
        l.status === "assigned" || l.status === "in_transit"
      ).length || 0;

      const totalRevenue = transactionsRes.data
        ?.filter((t) => t.transaction_type?.includes("from_provider") || t.transaction_type === "commission")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;

      const totalProfit = loadsRes.data?.reduce((sum, l) => 
        sum + Number(l.profit || 0), 0
      ) || 0;

      // Calculate cash balances by method
      const cashBalance = getCashBalanceByMethod(
        transactionsRes.data || [],
        expensesRes.data || [],
        'cash'
      );
      const upiBalance = getCashBalanceByMethod(
        transactionsRes.data || [],
        expensesRes.data || [],
        'upi'
      );
      const bankBalance = getCashBalanceByMethod(
        transactionsRes.data || [],
        expensesRes.data || [],
        'bank_transfer'
      );

      setStats({
        totalTrucks: trucksRes.count || 0,
        activeTrucks,
        assignedTrucks,
        totalLoads: loadsRes.count || 0,
        activeLoads,
        totalRevenue,
        totalProfit,
        pendingTransactions: loadsRes.data?.filter((l) => l.status === "pending").length || 0,
        cashBalance,
        upiBalance,
        bankBalance,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    subtitle, 
    trend 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    subtitle?: string;
    trend?: string;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className="text-xs text-success mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your logistics operations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Trucks"
          value={stats?.totalTrucks || 0}
          icon={Truck}
          subtitle={`${stats?.activeTrucks || 0} active • ${stats?.assignedTrucks || 0} assigned`}
        />
        <StatCard
          title="Total Loads"
          value={stats?.totalLoads || 0}
          icon={Package}
          subtitle={`${stats?.activeLoads || 0} in progress`}
        />
        <StatCard
          title="Total Revenue"
          value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          title="Total Profit"
          value={`₹${(stats?.totalProfit || 0).toLocaleString()}`}
          icon={TrendingUp}
          trend="+12.5% from last month"
        />
        <StatCard
          title="Pending Loads"
          value={stats?.pendingTransactions || 0}
          icon={Clock}
          subtitle="Awaiting assignment"
        />
        <StatCard
          title="Active Operations"
          value={stats?.activeLoads || 0}
          icon={Package}
          subtitle="Loads in transit"
        />
      </div>

      {/* Cash Flow by Payment Method */}
      <CashFlowByMethod
        cashBalance={stats?.cashBalance || 0}
        upiBalance={stats?.upiBalance || 0}
        bankBalance={stats?.bankBalance || 0}
      />

      {/* Top Providers with Outstanding Balance */}
      <TopProvidersWidget />

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <button
            onClick={() => window.location.href = "/trucks"}
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
          >
            <Truck className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-semibold">Add Truck</h3>
            <p className="text-sm text-muted-foreground">Register a new truck</p>
          </button>
          <button
            onClick={() => window.location.href = "/loads"}
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
          >
            <Package className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-semibold">Create Load</h3>
            <p className="text-sm text-muted-foreground">Add a new load</p>
          </button>
          <button
            onClick={() => window.location.href = "/reports"}
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
          >
            <TrendingUp className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-semibold">View Reports</h3>
            <p className="text-sm text-muted-foreground">Analyze performance</p>
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

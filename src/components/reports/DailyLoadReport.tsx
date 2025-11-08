import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer, CalendarIcon, Truck, MapPin, DollarSign, Package } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

/**
 * @interface DailyLoadData
 * @description The daily load data interface.
 * @property {string} load_id - The load ID.
 * @property {string} truck_number - The truck number.
 * @property {string} loading_location - The loading location.
 * @property {string} unloading_location - The unloading location.
 * @property {string} material_description - The material description.
 * @property {string} status - The load status.
 * @property {number} provider_freight - The provider freight.
 * @property {number} truck_freight - The truck freight.
 * @property {string} assigned_at - The assignment date.
 * @property {number} advances - The advances.
 * @property {number} expenses - The expenses.
 * @property {number} profit - The profit.
 * @property {string} payment_model - The payment model.
 */
interface DailyLoadData {
  load_id: string;
  truck_number: string;
  loading_location: string;
  unloading_location: string;
  material_description: string;
  status: string;
  provider_freight: number;
  truck_freight: number;
  assigned_at: string;
  advances: number;
  expenses: number;
  profit: number;
  payment_model: string;
}

/**
 * @name DailyLoadReport
 * @description A component to display the daily load report.
 * @returns {JSX.Element} - The JSX for the component.
 */
export const DailyLoadReport = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<DailyLoadData[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchDailyReport();
  }, [selectedDate, statusFilter]);

  const fetchDailyReport = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch load assignments for the selected date
      const { data: assignments, error } = await supabase
        .from("load_assignments")
        .select(`
          *,
          trucks!inner(truck_number),
          loads!inner(
            id,
            loading_location,
            unloading_location,
            material_description,
            status,
            provider_freight,
            truck_freight,
            profit,
            payment_model
          )
        `)
        .eq("user_id", user.id)
        .gte("assigned_at", startOfDay.toISOString())
        .lte("assigned_at", endOfDay.toISOString());

      if (error) throw error;

      // Fetch transactions and expenses for each assignment
      const enrichedData = await Promise.all(
        (assignments || []).map(async (assignment) => {
          const [transactionsRes, expensesRes] = await Promise.all([
            supabase
              .from("transactions")
              .select("amount, transaction_type")
              .eq("load_assignment_id", assignment.id),
            supabase
              .from("expenses")
              .select("amount")
              .eq("load_assignment_id", assignment.id),
          ]);

          const advances = (transactionsRes.data || [])
            .filter(t => t.transaction_type === 'advance_to_driver')
            .reduce((sum, t) => sum + parseFloat(t.amount?.toString() || "0"), 0);

          const expenses = (expensesRes.data || [])
            .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

          return {
            load_id: assignment.loads.id,
            truck_number: assignment.trucks.truck_number,
            loading_location: assignment.loads.loading_location,
            unloading_location: assignment.loads.unloading_location,
            material_description: assignment.loads.material_description,
            status: assignment.loads.status,
            provider_freight: assignment.loads.provider_freight || 0,
            truck_freight: assignment.loads.truck_freight || 0,
            assigned_at: assignment.assigned_at,
            advances,
            expenses,
            profit: assignment.loads.profit || 0,
            payment_model: assignment.loads.payment_model || 'standard',
          };
        })
      );

      // Filter by status if needed
      const filtered = statusFilter === "all" 
        ? enrichedData 
        : enrichedData.filter(d => d.status === statusFilter);

      setReportData(filtered);
    } catch (error) {
      console.error("Error fetching daily report:", error);
      toast.error("Failed to fetch daily report");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Daily Load Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Date: ${format(selectedDate, "PPP")}`, 14, 28);
    
    const tableData = reportData.map(load => [
      load.truck_number,
      `${load.loading_location} → ${load.unloading_location}`,
      load.status.toUpperCase(),
      `₹${load.provider_freight.toLocaleString()}`,
      `₹${load.truck_freight.toLocaleString()}`,
      `₹${load.advances.toLocaleString()}`,
      `₹${load.expenses.toLocaleString()}`,
      `₹${load.profit.toLocaleString()}`,
    ]);

    autoTable(doc, {
      head: [['Truck', 'Route', 'Status', 'Provider', 'Truck', 'Advance', 'Expenses', 'Profit']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 35;
    doc.setFontSize(12);
    doc.text(`Total Loads: ${reportData.length}`, 14, finalY + 10);
    doc.text(
      `Total Revenue: ₹${reportData.reduce((sum, l) => sum + l.provider_freight, 0).toLocaleString()}`,
      14,
      finalY + 18
    );
    doc.text(
      `Total Advances: ₹${reportData.reduce((sum, l) => sum + l.advances, 0).toLocaleString()}`,
      14,
      finalY + 26
    );
    doc.text(
      `Total Profit: ₹${reportData.reduce((sum, l) => sum + l.profit, 0).toLocaleString()}`,
      14,
      finalY + 34
    );

    doc.save(`daily-report-${format(selectedDate, "yyyy-MM-dd")}.pdf`);
    toast.success("PDF downloaded successfully");
  };

  const handlePrint = () => {
    window.print();
  };

  const totals = {
    loads: reportData.length,
    revenue: reportData.reduce((sum, l) => sum + l.provider_freight, 0),
    truckCost: reportData.reduce((sum, l) => sum + l.truck_freight, 0),
    advances: reportData.reduce((sum, l) => sum + l.advances, 0),
    expenses: reportData.reduce((sum, l) => sum + l.expenses, 0),
    profit: reportData.reduce((sum, l) => sum + l.profit, 0),
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daily Load Report</CardTitle>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Button size="sm" variant="outline" onClick={generatePDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading report...</div>
          ) : reportData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No loads assigned on this date
            </div>
          ) : (
            <div className="space-y-4">
              {reportData.map((load, index) => (
                <Card key={load.load_id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{load.truck_number}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={load.status === 'completed' ? 'default' : 'secondary'}>
                          {load.status.toUpperCase().replace('_', ' ')}
                        </Badge>
                        {load.payment_model === 'commission_only' && (
                          <Badge variant="outline">Commission-Only</Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      <div className="space-y-2">
                        <div className="flex items-start text-sm">
                          <MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">From: {load.loading_location}</p>
                            <p className="text-muted-foreground">To: {load.unloading_location}</p>
                          </div>
                        </div>
                        <div className="flex items-start text-sm">
                          <Package className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="font-medium">{load.material_description}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Provider Freight:</span>
                          <p className="font-semibold text-success">₹{load.provider_freight.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Truck Freight:</span>
                          <p className="font-semibold text-blue-500">₹{load.truck_freight.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Advance Given:</span>
                          <p className="font-semibold text-warning">₹{load.advances.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expenses:</span>
                          <p className="font-semibold text-amber-600">₹{load.expenses.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-3" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Assigned: {new Date(load.assigned_at).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Expected Profit:</span>
                        <span className={`text-lg font-bold ${load.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                          ₹{load.profit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {reportData.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Daily Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Loads</p>
                <p className="text-2xl font-bold">{totals.loads}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-success">₹{totals.revenue.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Truck Cost</p>
                <p className="text-2xl font-bold text-blue-500">₹{totals.truckCost.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Advances</p>
                <p className="text-2xl font-bold text-warning">₹{totals.advances.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-amber-600">₹{totals.expenses.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Expected Profit</p>
                <p className={`text-2xl font-bold ${totals.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ₹{totals.profit.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Smartphone, Building2 } from "lucide-react";

interface CashFlowByMethodProps {
  cashBalance: number;
  upiBalance: number;
  bankBalance: number;
}

export const CashFlowByMethod = ({ cashBalance, upiBalance, bankBalance }: CashFlowByMethodProps) => {
  const total = cashBalance + upiBalance + bankBalance;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cash Position by Method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">Cash in Hand</span>
          </div>
          <span className="text-lg font-bold">
            ₹{cashBalance.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium">UPI Balance</span>
          </div>
          <span className="text-lg font-bold">
            ₹{upiBalance.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium">Bank Balance</span>
          </div>
          <span className="text-lg font-bold">
            ₹{bankBalance.toLocaleString()}
          </span>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Available</span>
            <span className="text-xl font-bold text-primary">
              ₹{total.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

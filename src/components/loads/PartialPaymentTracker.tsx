import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  transaction_date: string;
}

interface PartialPaymentTrackerProps {
  title: string;
  payments: Payment[];
  totalPaid: number;
  targetAmount: number;
  percentage: number;
  onAddPayment: () => void;
}

export const PartialPaymentTracker = ({
  title,
  payments,
  totalPaid,
  targetAmount,
  percentage,
  onAddPayment,
}: PartialPaymentTrackerProps) => {
  const remaining = targetAmount - totalPaid;
  const isComplete = percentage >= 100;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{title}</h4>
        <Badge variant={isComplete ? "default" : "secondary"}>
          {payments.length} payment{payments.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            ₹{totalPaid.toLocaleString()} / ₹{targetAmount.toLocaleString()}
          </span>
          <span className="font-medium">{percentage.toFixed(1)}%</span>
        </div>
        <Progress value={percentage} className="h-2" />
        {!isComplete && (
          <p className="text-sm text-muted-foreground">
            Remaining: ₹{remaining.toLocaleString()}
          </p>
        )}
      </div>

      {payments.length > 0 && (
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded"
            >
              <div>
                <span className="font-medium">₹{payment.amount.toLocaleString()}</span>
                <span className="text-muted-foreground ml-2">via {payment.payment_method}</span>
              </div>
              <span className="text-muted-foreground text-xs">
                {format(new Date(payment.transaction_date), 'dd MMM yyyy')}
              </span>
            </div>
          ))}
        </div>
      )}

      {!isComplete && (
        <Button onClick={onAddPayment} variant="outline" size="sm" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Payment
        </Button>
      )}
    </Card>
  );
};

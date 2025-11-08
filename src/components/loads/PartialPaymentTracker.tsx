import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

/**
 * @interface Payment
 * @description The payment interface.
 * @property {string} id - The payment ID.
 * @property {number} amount - The payment amount.
 * @property {string} payment_method - The payment method.
 * @property {string} transaction_date - The transaction date.
 */
interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  transaction_date: string;
}

/**
 * @interface PartialPaymentTrackerProps
 * @description The props for the PartialPaymentTracker component.
 * @property {string} title - The title of the tracker.
 * @property {Payment[]} payments - The list of payments.
 * @property {number} totalPaid - The total amount paid.
 * @property {number} targetAmount - The target amount.
 * @property {number} percentage - The percentage paid.
 * @property {() => void} onAddPayment - The function to call when the add payment button is clicked.
 * @property {(payment: Payment) => void} [onEditPayment] - The function to call when the edit payment button is clicked.
 * @property {(paymentId: string) => void} [onDeletePayment] - The function to call when the delete payment button is clicked.
 * @property {boolean} [allowEdit] - Whether to allow editing and deleting payments.
 */
interface PartialPaymentTrackerProps {
  title: string;
  payments: Payment[];
  totalPaid: number;
  targetAmount: number;
  percentage: number;
  onAddPayment: () => void;
  onEditPayment?: (payment: Payment) => void;
  onDeletePayment?: (paymentId: string) => void;
  allowEdit?: boolean;
}

/**
 * @name PartialPaymentTracker
 * @description A component to track partial payments.
 * @param {PartialPaymentTrackerProps} props - The props for the component.
 * @returns {JSX.Element} - The JSX for the component.
 */
export const PartialPaymentTracker = ({
  title,
  payments,
  totalPaid,
  targetAmount,
  percentage,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
  allowEdit = true,
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
              className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded hover:bg-muted group"
            >
              <div>
                <span className="font-medium">₹{payment.amount.toLocaleString()}</span>
                <span className="text-muted-foreground ml-2">via {payment.payment_method}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {format(new Date(payment.transaction_date), 'dd MMM yyyy')}
                </span>
                {allowEdit && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => onEditPayment?.(payment)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => onDeletePayment?.(payment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
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

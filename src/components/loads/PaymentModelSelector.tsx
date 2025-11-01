import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface PaymentModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const PaymentModelSelector = ({ value, onChange }: PaymentModelSelectorProps) => {
  return (
    <div className="space-y-3">
      <Label>Payment Model</Label>
      <RadioGroup value={value} onValueChange={onChange}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="standard" id="standard" />
          <Label htmlFor="standard" className="font-normal cursor-pointer">
            Standard - I handle all payments
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="commission_only" id="commission_only" />
          <Label htmlFor="commission_only" className="font-normal cursor-pointer">
            Commission Only - Party pays driver directly
          </Label>
        </div>
      </RadioGroup>
      
      {value === 'commission_only' && (
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            In commission-only mode, the party will pay the driver directly. You will only receive your commission for this load.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

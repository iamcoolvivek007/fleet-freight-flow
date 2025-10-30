-- Create expenses table for trip-related expenses
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  load_assignment_id UUID NOT NULL,
  expense_type TEXT NOT NULL CHECK (expense_type IN ('fuel', 'toll', 'maintenance', 'driver_allowance', 'loading_charges', 'unloading_charges', 'other')),
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT,
  receipt_url TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create charges table for additional charges
CREATE TABLE public.charges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  load_assignment_id UUID NOT NULL,
  charge_type TEXT NOT NULL CHECK (charge_type IN ('detention', 'late_delivery', 'damage', 'extra_loading', 'other')),
  amount NUMERIC NOT NULL,
  charged_to TEXT NOT NULL CHECK (charged_to IN ('party', 'supplier')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'waived')),
  description TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new fields to load_assignments table
ALTER TABLE public.load_assignments
ADD COLUMN total_expenses NUMERIC DEFAULT 0,
ADD COLUMN total_charges NUMERIC DEFAULT 0,
ADD COLUMN net_profit NUMERIC DEFAULT 0,
ADD COLUMN final_settlement_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN settlement_status TEXT DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'partial', 'completed'));

-- Enable RLS on expenses table
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for expenses
CREATE POLICY "Users can view own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on charges table
ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for charges
CREATE POLICY "Users can view own charges"
  ON public.charges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own charges"
  ON public.charges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own charges"
  ON public.charges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own charges"
  ON public.charges FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for expense receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for expense receipts
CREATE POLICY "Users can view own expense receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'expense-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own expense receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'expense-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own expense receipts"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'expense-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own expense receipts"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'expense-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create trigger for expenses updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for charges updated_at
CREATE TRIGGER update_charges_updated_at
  BEFORE UPDATE ON public.charges
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
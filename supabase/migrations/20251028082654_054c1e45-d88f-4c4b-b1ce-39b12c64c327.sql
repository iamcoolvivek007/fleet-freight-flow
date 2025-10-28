-- Create enum types
CREATE TYPE truck_type AS ENUM ('open', 'container');
CREATE TYPE load_status AS ENUM ('pending', 'assigned', 'in_transit', 'delivered', 'completed');
CREATE TYPE transaction_type AS ENUM ('advance_to_driver', 'balance_to_driver', 'advance_from_provider', 'balance_from_provider', 'commission');
CREATE TYPE payment_method AS ENUM ('cash', 'upi', 'bank_transfer');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create trucks table
CREATE TABLE public.trucks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  truck_number TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  truck_type truck_type NOT NULL,
  truck_length DECIMAL(10,2) NOT NULL,
  carrying_capacity DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create load_providers table
CREATE TABLE public.load_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create loads table
CREATE TABLE public.loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  load_provider_id UUID NOT NULL REFERENCES public.load_providers(id) ON DELETE CASCADE,
  loading_location TEXT NOT NULL,
  unloading_location TEXT NOT NULL,
  material_description TEXT NOT NULL,
  material_weight DECIMAL(10,2) NOT NULL,
  provider_freight DECIMAL(10,2) NOT NULL,
  truck_freight DECIMAL(10,2),
  profit DECIMAL(10,2),
  status load_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create load_assignments table
CREATE TABLE public.load_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  truck_id UUID NOT NULL REFERENCES public.trucks(id) ON DELETE CASCADE,
  commission_percentage DECIMAL(5,2) DEFAULT 0,
  commission_amount DECIMAL(10,2),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  load_assignment_id UUID REFERENCES public.load_assignments(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_details TEXT,
  transaction_date TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for trucks
CREATE POLICY "Users can view own trucks" ON public.trucks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trucks" ON public.trucks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trucks" ON public.trucks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trucks" ON public.trucks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for load_providers
CREATE POLICY "Users can view own providers" ON public.load_providers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own providers" ON public.load_providers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own providers" ON public.load_providers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own providers" ON public.load_providers FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for loads
CREATE POLICY "Users can view own loads" ON public.loads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own loads" ON public.loads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own loads" ON public.loads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own loads" ON public.loads FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for load_assignments
CREATE POLICY "Users can view own assignments" ON public.load_assignments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assignments" ON public.load_assignments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assignments" ON public.load_assignments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assignments" ON public.load_assignments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.trucks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.load_providers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.loads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.load_assignments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
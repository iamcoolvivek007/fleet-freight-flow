-- Add third_party_name field to trucks table
ALTER TABLE public.trucks 
ADD COLUMN third_party_name TEXT;

-- Add indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_trucks_search ON public.trucks(truck_number, driver_name, owner_name);
CREATE INDEX IF NOT EXISTS idx_loads_search ON public.loads(loading_location, unloading_location);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date, transaction_type);

-- Add unique constraint to prevent double assignment of trucks to loads
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_assignment 
ON public.load_assignments(truck_id, load_id) 
WHERE settlement_status != 'completed';
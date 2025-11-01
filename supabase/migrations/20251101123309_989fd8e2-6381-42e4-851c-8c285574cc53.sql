-- Add payment model to loads table
ALTER TABLE loads ADD COLUMN payment_model TEXT DEFAULT 'standard';
ALTER TABLE loads ADD CONSTRAINT check_payment_model 
  CHECK (payment_model IN ('standard', 'commission_only'));

-- Add inactive reason to trucks table
ALTER TABLE trucks ADD COLUMN inactive_reason TEXT;

-- Add index for better query performance
CREATE INDEX idx_loads_payment_model ON loads(payment_model);
CREATE INDEX idx_trucks_inactive_reason ON trucks(inactive_reason);

-- Add comment for documentation
COMMENT ON COLUMN loads.payment_model IS 'Payment model: standard (we handle all payments) or commission_only (party pays driver directly)';
COMMENT ON COLUMN trucks.inactive_reason IS 'Reason for truck being inactive: assigned_to_load, manual, maintenance, etc.';
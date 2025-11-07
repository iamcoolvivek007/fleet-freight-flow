# FreightFlow Database Schema

## Overview

FreightFlow uses PostgreSQL (via Lovable Cloud/Supabase) with Row-Level Security (RLS) to ensure data isolation between users. All tables include `user_id` foreign key referencing `auth.users(id)`, and RLS policies enforce that users can only access their own data.

## Core Concepts

- **Primary Keys**: All tables use UUID primary keys generated via `gen_random_uuid()`
- **Timestamps**: Most tables include `created_at` and `updated_at` (auto-managed via triggers)
- **Row-Level Security**: Enabled on all tables with policies filtering by `auth.uid() = user_id`
- **Foreign Keys**: Relationships between tables maintained via UUID references
- **Enums**: Custom types for status fields, payment methods, truck types, etc.

---

## Tables

### 1. profiles

**Purpose**: Extended user information linked to Supabase Auth users

**Schema**:
```sql
CREATE TABLE profiles (
  id UUID NOT NULL PRIMARY KEY,  -- References auth.users(id)
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | - | Primary key, references auth.users(id) |
| full_name | text | Yes | null | User's display name |
| created_at | timestamptz | No | now() | Record creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**RLS Policies**:
- ✅ SELECT: Users can view their own profile (`auth.uid() = id`)
- ✅ INSERT: Users can create their own profile (`auth.uid() = id`)
- ✅ UPDATE: Users can update their own profile (`auth.uid() = id`)
- ❌ DELETE: Not allowed (managed via auth.users)

**Relationships**: None (top-level user data)

**Indexes**: 
- Primary key index on `id`

---

### 2. trucks

**Purpose**: Fleet registry with truck specifications, owner/driver details, and availability status

**Schema**:
```sql
CREATE TABLE trucks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  truck_number TEXT NOT NULL,
  truck_type truck_type NOT NULL,
  truck_length NUMERIC NOT NULL,
  carrying_capacity NUMERIC NOT NULL,
  driver_name TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  driver_image_url TEXT,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  third_party_name TEXT,
  third_party_contact TEXT,
  truck_image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  inactive_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | Owner of this truck record |
| truck_number | text | No | - | License plate / registration number |
| truck_type | enum | No | - | Type: 'open', 'container', 'trailer' |
| truck_length | numeric | No | - | Length in feet |
| carrying_capacity | numeric | No | - | Capacity in tons |
| driver_name | text | No | - | Driver's full name |
| driver_phone | text | No | - | Driver's phone number |
| driver_image_url | text | Yes | null | URL to driver photo in storage |
| owner_name | text | No | - | Truck owner's name |
| owner_phone | text | No | - | Owner's contact number |
| third_party_name | text | Yes | null | Name if truck on lease |
| third_party_contact | text | Yes | null | Third-party contact |
| truck_image_url | text | Yes | null | URL to truck photo in storage |
| is_active | boolean | No | true | Available for assignment |
| inactive_reason | text | Yes | null | Reason if not active: 'assigned_to_load', 'maintenance', etc. |
| created_at | timestamptz | No | now() | Record creation |
| updated_at | timestamptz | No | now() | Last update |

**RLS Policies**: Full CRUD for own trucks (`auth.uid() = user_id`)

**Business Rules**:
- When truck assigned to load: `is_active = false`, `inactive_reason = 'assigned_to_load'`
- When load completed: `is_active = true`, `inactive_reason = null`
- Truck cannot be deleted if assigned to active load (enforced in UI)

**Indexes**:
- Primary key on `id`
- Index on `user_id` for query performance
- Index on `is_active` for filtering active trucks

**Triggers**:
- `update_trucks_updated_at`: Auto-updates `updated_at` on row update

---

### 3. load_providers

**Purpose**: Client/party database for load providers

**Schema**:
```sql
CREATE TABLE load_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | Owner of this provider record |
| provider_name | text | No | - | Company/party name |
| contact_person | text | Yes | null | Primary contact name |
| phone | text | No | - | Contact phone number |
| email | text | Yes | null | Contact email |
| address | text | Yes | null | Business address |
| is_active | boolean | No | true | Is provider currently active |
| created_at | timestamptz | No | now() | Record creation |
| updated_at | timestamptz | No | now() | Last update |

**RLS Policies**: Full CRUD for own providers (`auth.uid() = user_id`)

**Business Rules**:
- Provider can be marked inactive but not deleted if they have loads
- Outstanding balance calculated across all loads for this provider

**Indexes**:
- Primary key on `id`
- Index on `user_id`
- Index on `is_active`

**Triggers**:
- `update_load_providers_updated_at`: Auto-updates `updated_at`

---

### 4. loads

**Purpose**: Shipment/load records with route, material, and pricing details

**Schema**:
```sql
CREATE TABLE loads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  load_provider_id UUID NOT NULL,
  loading_location TEXT NOT NULL,
  unloading_location TEXT NOT NULL,
  material_description TEXT NOT NULL,
  material_weight NUMERIC NOT NULL,
  provider_freight NUMERIC NOT NULL,
  truck_freight NUMERIC,
  profit NUMERIC,
  payment_model TEXT DEFAULT 'standard',
  status load_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | Owner of this load |
| load_provider_id | uuid | No | - | Which provider/party provided this load |
| loading_location | text | No | - | Pickup location |
| unloading_location | text | No | - | Delivery location |
| material_description | text | No | - | What's being transported |
| material_weight | numeric | No | - | Weight in tons |
| provider_freight | numeric | No | - | Amount provider pays you |
| truck_freight | numeric | Yes | null | Amount you pay driver (set when truck assigned) |
| profit | numeric | Yes | null | Calculated profit (may be cached) |
| payment_model | text | No | 'standard' | 'standard' or 'commission_only' |
| status | enum | No | 'pending' | Load lifecycle status |
| created_at | timestamptz | No | now() | Record creation |
| updated_at | timestamptz | No | now() | Last update |

**RLS Policies**: Full CRUD for own loads (`auth.uid() = user_id`)

**Status Enum Values**:
1. `pending` - Created, awaiting truck assignment
2. `assigned` - Truck assigned via load_assignments table
3. `in_transit` - Driver picked up load, en route
4. `delivered` - Load delivered at destination
5. `completed` - All payments settled, load finalized

**Payment Models**:
- **standard**: You handle all payments (provider → you → driver)
- **commission_only**: Provider pays driver directly, you get commission

**Business Rules**:
- `truck_freight` must be set when status changes to 'assigned'
- Cannot delete load if it has transactions
- Status can only move forward in lifecycle (no going back to pending from assigned)

**Indexes**:
- Primary key on `id`
- Index on `user_id`
- Index on `load_provider_id`
- Index on `status`
- Composite index on (`user_id`, `status`) for filtered queries

**Triggers**:
- `update_loads_updated_at`: Auto-updates `updated_at`

---

### 5. load_assignments

**Purpose**: Links loads to trucks and tracks financial details per assignment

**Schema**:
```sql
CREATE TABLE load_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  load_id UUID NOT NULL,
  truck_id UUID NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  commission_percentage NUMERIC DEFAULT 0,
  commission_amount NUMERIC,
  total_expenses NUMERIC DEFAULT 0,
  total_charges NUMERIC DEFAULT 0,
  net_profit NUMERIC DEFAULT 0,
  settlement_status TEXT DEFAULT 'pending',
  final_settlement_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | Owner of this assignment |
| load_id | uuid | No | - | Which load is assigned |
| truck_id | uuid | No | - | Which truck is assigned |
| assigned_at | timestamptz | No | now() | When assignment was made |
| commission_percentage | numeric | No | 0 | Commission % (if commission model) |
| commission_amount | numeric | Yes | null | Fixed commission amount |
| total_expenses | numeric | No | 0 | Sum of all expenses |
| total_charges | numeric | No | 0 | Sum of all charges |
| net_profit | numeric | No | 0 | Calculated net profit |
| settlement_status | text | No | 'pending' | 'pending', 'partial', 'completed' |
| final_settlement_date | timestamptz | Yes | null | When fully settled |
| created_at | timestamptz | No | now() | Record creation |
| updated_at | timestamptz | No | now() | Last update |

**RLS Policies**: Full CRUD for own assignments (`auth.uid() = user_id`)

**Business Rules**:
- One load can have only one assignment (1:1 relationship)
- When created, truck status changes to inactive
- `total_expenses`, `total_charges`, `net_profit` are calculated fields (updated via business logic)
- `settlement_status` updates automatically when all payments complete

**Indexes**:
- Primary key on `id`
- Index on `user_id`
- Unique index on `load_id` (one load → one assignment)
- Index on `truck_id`

**Triggers**:
- `update_load_assignments_updated_at`: Auto-updates `updated_at`

---

### 6. transactions

**Purpose**: Payment records for all transaction types (advances, balances, commissions)

**Schema**:
```sql
CREATE TABLE transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  load_assignment_id UUID,
  transaction_type transaction_type NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method payment_method NOT NULL,
  payment_details TEXT,
  notes TEXT,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | Owner of this transaction |
| load_assignment_id | uuid | Yes | null | Related load assignment (null for standalone transactions) |
| transaction_type | enum | No | - | Type of transaction |
| amount | numeric | No | - | Transaction amount |
| payment_method | enum | No | - | How payment was made |
| payment_details | text | Yes | null | Transaction ID, cheque number, etc. |
| notes | text | Yes | null | Additional notes |
| transaction_date | timestamptz | No | now() | When transaction occurred |
| created_at | timestamptz | No | now() | Record creation |
| updated_at | timestamptz | No | now() | Last update |

**RLS Policies**: Full CRUD for own transactions (`auth.uid() = user_id`)

**Transaction Type Enum**:
- `advance_from_provider`: Advance payment received from provider
- `balance_from_provider`: Balance payment received from provider
- `advance_to_driver`: Advance payment made to driver
- `balance_to_driver`: Balance payment made to driver
- `commission`: Commission received (commission-only model)

**Payment Method Enum**:
- `cash`: Cash payment
- `upi`: UPI/digital payment
- `bank_transfer`: Bank transfer
- `cheque`: Cheque payment

**Business Rules**:
- Multiple advances can be recorded before balance (partial payments)
- `amount` must be positive
- When edited/deleted, all financial calculations recalculate

**Indexes**:
- Primary key on `id`
- Index on `user_id`
- Index on `load_assignment_id`
- Index on `transaction_type`
- Index on `payment_method`
- Composite index on (`load_assignment_id`, `transaction_type`)

**Triggers**:
- `update_transactions_updated_at`: Auto-updates `updated_at`

---

### 7. expenses

**Purpose**: Operational expenses incurred during load execution

**Schema**:
```sql
CREATE TABLE expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  load_assignment_id UUID NOT NULL,
  expense_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method payment_method NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | Owner of this expense |
| load_assignment_id | uuid | No | - | Which load this expense is for |
| expense_type | text | No | - | Type: 'fuel', 'maintenance', 'toll', 'loading_charges', 'other' |
| amount | numeric | No | - | Expense amount |
| payment_method | enum | No | - | How expense was paid |
| payment_date | timestamptz | No | now() | When expense was paid |
| description | text | Yes | null | Details about expense |
| receipt_url | text | Yes | null | URL to receipt image/PDF in storage |
| created_at | timestamptz | No | now() | Record creation |
| updated_at | timestamptz | No | now() | Last update |

**RLS Policies**: Full CRUD for own expenses (`auth.uid() = user_id`)

**Expense Types**:
- `fuel`: Fuel/diesel costs
- `maintenance`: Vehicle maintenance
- `toll`: Toll charges
- `loading_charges`: Loading/unloading fees
- `other`: Miscellaneous expenses

**Business Rules**:
- Expenses reduce net profit
- Expenses affect cash balance by payment method
- Receipt upload optional but recommended

**Indexes**:
- Primary key on `id`
- Index on `user_id`
- Index on `load_assignment_id`
- Index on `expense_type`

**Triggers**:
- `update_expenses_updated_at`: Auto-updates `updated_at`

---

### 8. charges

**Purpose**: Additional fees charged to party or supplier

**Schema**:
```sql
CREATE TABLE charges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  load_assignment_id UUID NOT NULL,
  charge_type TEXT NOT NULL,
  charged_to TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | Owner of this charge |
| load_assignment_id | uuid | No | - | Which load this charge is for |
| charge_type | text | No | - | Type: 'detention', 'loading_unloading', 'extra_weight', 'other' |
| charged_to | text | No | - | 'party' or 'supplier' |
| amount | numeric | No | - | Charge amount |
| description | text | Yes | null | Reason for charge |
| status | text | No | 'pending' | 'pending', 'paid', 'waived' |
| created_at | timestamptz | No | now() | Record creation |
| updated_at | timestamptz | No | now() | Last update |

**RLS Policies**: Full CRUD for own charges (`auth.uid() = user_id`)

**Charge Types**:
- `detention`: Delay charges
- `loading_unloading`: Extra loading/unloading fees
- `extra_weight`: Overweight charges
- `other`: Miscellaneous charges

**Charged To**:
- `party`: Charge to load provider (increases revenue)
- `supplier`: Charge to driver/supplier (increases costs)

**Status Values**:
- `pending`: Charge applied but not yet paid
- `paid`: Charge has been paid
- `waived`: Charge forgiven

**Business Rules**:
- Charges with status 'paid' and charged_to 'party' add to revenue
- Charges with status 'paid' and charged_to 'supplier' add to costs
- Pending/waived charges don't affect financial calculations

**Indexes**:
- Primary key on `id`
- Index on `user_id`
- Index on `load_assignment_id`
- Index on `charged_to`
- Index on `status`

**Triggers**:
- `update_charges_updated_at`: Auto-updates `updated_at`

---

## Database Functions

### handle_updated_at()

Auto-updates the `updated_at` timestamp on row updates.

```sql
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
```

**Applied to**: All tables with `updated_at` column

**Usage**:
```sql
CREATE TRIGGER update_<table_name>_updated_at
BEFORE UPDATE ON <table_name>
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();
```

---

## Storage Buckets

### truck-images

**Purpose**: Store truck and driver photos

**Configuration**:
- Access: Public
- Max file size: 5MB
- Allowed types: JPEG, PNG, WebP
- Path structure: `{user_id}/{timestamp}-{filename}`

**RLS Policies**:
```sql
-- Anyone can view
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'truck-images');

-- Users can upload to their own folder
CREATE POLICY "Users can upload own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'truck-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### expense-receipts

**Purpose**: Store expense receipt images and PDFs

**Configuration**:
- Access: Public
- Max file size: 10MB
- Allowed types: JPEG, PNG, PDF
- Path structure: `{user_id}/{timestamp}-{filename}`

**RLS Policies**: Similar to truck-images

---

## Enums (Custom Types)

### load_status
```sql
CREATE TYPE load_status AS ENUM (
  'pending',
  'assigned',
  'in_transit',
  'delivered',
  'completed'
);
```

### truck_type
```sql
CREATE TYPE truck_type AS ENUM (
  'open',
  'container',
  'trailer'
);
```

### payment_method
```sql
CREATE TYPE payment_method AS ENUM (
  'cash',
  'upi',
  'bank_transfer',
  'cheque'
);
```

### transaction_type
```sql
CREATE TYPE transaction_type AS ENUM (
  'advance_from_provider',
  'balance_from_provider',
  'advance_to_driver',
  'balance_to_driver',
  'commission'
);
```

---

## Entity Relationship Diagram

```
auth.users (Supabase managed)
  ↓
profiles (1:1)
  ↓
user_id (Foreign key in all tables below)
  ↓
├── trucks
├── load_providers
│     ↓
│   loads
│     ↓
│   load_assignments
│     ├── transactions
│     ├── expenses
│     └── charges
```

---

## Data Integrity & Constraints

### Foreign Key Constraints
- All `user_id` columns reference authenticated user
- `load_provider_id` in loads references `load_providers(id)`
- `load_id` in load_assignments references `loads(id)`
- `truck_id` in load_assignments references `trucks(id)`
- `load_assignment_id` in transactions/expenses/charges references `load_assignments(id)`

### Check Constraints
- `amount` fields must be positive (> 0)
- `material_weight` must be positive
- `carrying_capacity` must be positive
- Enum fields enforce valid values

### Unique Constraints
- `truck_number` should be unique per user (not enforced at DB level currently)
- `load_id` in load_assignments is unique (one load → one assignment)

---

## Migration Strategy

### Creating New Migration

1. Create file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Write SQL with proper checks:
```sql
-- Add column safely
ALTER TABLE trucks 
ADD COLUMN IF NOT EXISTS fuel_type TEXT DEFAULT 'diesel';

-- Create table safely
CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  truck_id UUID NOT NULL,
  -- ... other columns
);

-- Add RLS
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records"
ON maintenance_records FOR SELECT
USING (auth.uid() = user_id);
```

3. Lovable Cloud automatically applies migration on push

### Best Practices
- Always use `IF NOT EXISTS` / `IF EXISTS`
- Test migrations locally if using Supabase CLI
- Add RLS policies for new tables
- Create appropriate indexes for foreign keys
- Document breaking changes

---

## Performance Considerations

### Indexes
All foreign key columns are indexed for query performance.

### Query Optimization Tips
1. Use `select()` to fetch only needed columns
2. Implement pagination for large result sets
3. Batch related queries with `Promise.all()`
4. Use database views for complex queries (future enhancement)

### Monitoring
- Check slow queries in Lovable Cloud dashboard
- Monitor API usage and rate limits
- Review query patterns for optimization opportunities

---

## Security Best Practices

1. **Never expose `user_id` in URLs or client-side code**
2. **Always include `.eq('user_id', user.id)` in update/delete operations** (defense in depth)
3. **Validate input at client level** (react-hook-form + Zod)
4. **RLS is the primary security layer** (cannot be bypassed)
5. **Audit trail**: Consider logging sensitive operations (future enhancement)

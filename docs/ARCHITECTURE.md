# FreightFlow Architecture

## System Overview

FreightFlow is a full-stack logistics management application built with React and powered by Lovable Cloud (Supabase backend). The architecture follows a client-server model with clear separation of concerns and strong data isolation via Row-Level Security.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   React UI   │  │  TanStack    │  │   React      │ │
│  │  Components  │◄─┤   Query      │◄─┤   Router     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase Client (Auto-generated)           │
│         src/integrations/supabase/client.ts             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 Lovable Cloud (Backend)                 │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐ │
│  │ PostgreSQL │  │   Supabase │  │    Supabase      │ │
│  │  Database  │  │    Auth    │  │    Storage       │ │
│  │   + RLS    │  │            │  │                  │ │
│  └────────────┘  └────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Directory Structure

```
src/
├── pages/                          # Route-level components
│   ├── Index.tsx                   # Landing page (redirects to /auth)
│   ├── Auth.tsx                    # Login/Signup forms
│   ├── Dashboard.tsx               # Main KPI dashboard
│   ├── Trucks.tsx                  # Fleet management
│   ├── LoadProviders.tsx           # Client management
│   ├── Loads.tsx                   # Load/shipment management
│   ├── Transactions.tsx            # All financial transactions
│   ├── Reports.tsx                 # Business intelligence
│   └── NotFound.tsx                # 404 page
│
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx           # Main layout with sidebar + auth check
│   │
│   ├── dashboard/
│   │   ├── CashFlowByMethod.tsx    # Payment method balance cards
│   │   ├── TopProvidersWidget.tsx  # Outstanding payments widget
│   │   └── QuickPaymentDialog.tsx  # Fast payment recording
│   │
│   ├── trucks/
│   │   ├── TruckForm.tsx           # Create/edit truck
│   │   ├── TrucksList.tsx          # Display fleet grid
│   │   └── TruckStatusBadge.tsx    # Status indicator
│   │
│   ├── load-providers/
│   │   ├── LoadProviderForm.tsx    # Create/edit provider
│   │   ├── LoadProvidersList.tsx   # Display providers
│   │   └── ProviderDetailDialog.tsx # Provider details + history
│   │
│   ├── loads/                      # ⭐ Core business logic
│   │   ├── LoadForm.tsx            # Create/edit load
│   │   ├── LoadsList.tsx           # Display loads with status
│   │   ├── AssignTruckDialog.tsx   # Assign truck to load
│   │   ├── TransactionWorkflowDialog.tsx  # Main workflow manager
│   │   ├── PartialPaymentTracker.tsx      # Track payment progress
│   │   ├── TransactionFormDialog.tsx      # Add/edit transaction
│   │   ├── ExpenseFormDialog.tsx          # Add/edit expense
│   │   ├── ChargeFormDialog.tsx           # Add/edit charge
│   │   └── PaymentModelSelector.tsx       # Choose payment model
│   │
│   ├── reports/
│   │   ├── DriverBalanceSheet.tsx   # Driver payment report
│   │   ├── PartyBalanceSheet.tsx    # Provider payment report
│   │   └── DailyLoadReport.tsx      # Daily operations summary
│   │
│   ├── common/
│   │   ├── DateRangePicker.tsx      # Date range selector
│   │   └── SearchBar.tsx            # Reusable search input
│   │
│   └── ui/                          # shadcn/ui primitives
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── form.tsx
│       └── ... (30+ components)
│
├── lib/
│   ├── utils.ts                     # Utility functions (cn, etc.)
│   └── financialCalculations.ts    # ⭐ Core business logic
│
├── integrations/supabase/
│   ├── client.ts                    # Supabase client (auto-generated)
│   └── types.ts                     # Database types (auto-generated)
│
├── hooks/
│   ├── use-mobile.tsx               # Responsive breakpoint detection
│   └── use-toast.ts                 # Toast notification system
│
├── index.css                        # Global styles + CSS variables
├── main.tsx                         # App entry point
└── App.tsx                          # Root component with routing
```

### Component Hierarchy

```
App
 ├── BrowserRouter
 │    └── Routes
 │         ├── Index (/)
 │         ├── Auth (/auth)
 │         └── AppLayout (protected routes)
 │              ├── Dashboard (/dashboard)
 │              ├── Trucks (/trucks)
 │              ├── LoadProviders (/load-providers)
 │              ├── Loads (/loads)
 │              ├── Transactions (/transactions)
 │              └── Reports (/reports)
 └── Providers
      ├── QueryClientProvider (TanStack Query)
      ├── TooltipProvider (Radix UI)
      ├── Toaster (Toast notifications)
      └── Sonner (Alternative toast)
```

### State Management Strategy

#### Server State (TanStack Query)
Used for all data fetched from Supabase:
- **Loads**, **Trucks**, **Providers**, **Transactions**, **Expenses**, **Charges**
- Automatic caching, refetching, and background updates
- Query invalidation on mutations

```typescript
// Example: Fetching loads
const { data: loads, isLoading, refetch } = useQuery({
  queryKey: ["loads"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("loads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

// Example: Mutation with cache invalidation
const createLoadMutation = useMutation({
  mutationFn: async (newLoad) => {
    const { data, error } = await supabase
      .from("loads")
      .insert(newLoad)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["loads"] });
    toast.success("Load created successfully");
  },
});
```

#### Local UI State (React useState)
Used for:
- Dialog open/close states
- Form input values (managed by react-hook-form)
- Temporary UI states (hover, focus, etc.)
- Selected items in lists

```typescript
const [dialogOpen, setDialogOpen] = useState(false);
const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
```

#### Form State (React Hook Form + Zod)
All forms use `react-hook-form` with Zod validation:

```typescript
const form = useForm<z.infer<typeof truckSchema>>({
  resolver: zodResolver(truckSchema),
  defaultValues: { ... },
});
```

### Routing Architecture

**React Router v6** with nested routes:

```typescript
<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/auth" element={<Auth />} />
  <Route element={<AppLayout />}>  {/* Protected routes */}
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/trucks" element={<Trucks />} />
    <Route path="/load-providers" element={<LoadProviders />} />
    <Route path="/loads" element={<Loads />} />
    <Route path="/transactions" element={<Transactions />} />
    <Route path="/reports" element={<Reports />} />
  </Route>
  <Route path="*" element={<NotFound />} />
</Routes>
```

**Protected Routes**: `AppLayout` checks for authentication:
```typescript
useEffect(() => {
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) navigate("/auth");
  });
}, []);
```

### Data Flow

```
User Action (Click Button)
     │
     ▼
Component Handler (onClick)
     │
     ▼
TanStack Query Mutation
     │
     ▼
Supabase Client Call
     │
     ▼
Lovable Cloud API
     │
     ▼
PostgreSQL Database (with RLS check)
     │
     ▼
Response Data
     │
     ▼
Cache Update (Query Invalidation)
     │
     ▼
Component Re-render
     │
     ▼
Toast Notification
```

## Backend Architecture (Lovable Cloud)

### Database Schema Overview

```
profiles
  └─ id (PK, references auth.users)

trucks
  ├─ id (PK)
  ├─ user_id (FK to auth.users)
  └─ ... (truck details)

load_providers
  ├─ id (PK)
  ├─ user_id (FK to auth.users)
  └─ ... (provider details)

loads
  ├─ id (PK)
  ├─ user_id (FK to auth.users)
  ├─ load_provider_id (FK to load_providers)
  └─ ... (load details)

load_assignments
  ├─ id (PK)
  ├─ user_id (FK to auth.users)
  ├─ load_id (FK to loads)
  ├─ truck_id (FK to trucks)
  └─ ... (assignment + financial details)

transactions
  ├─ id (PK)
  ├─ user_id (FK to auth.users)
  ├─ load_assignment_id (FK to load_assignments)
  └─ ... (payment details)

expenses
  ├─ id (PK)
  ├─ user_id (FK to auth.users)
  ├─ load_assignment_id (FK to load_assignments)
  └─ ... (expense details)

charges
  ├─ id (PK)
  ├─ user_id (FK to auth.users)
  ├─ load_assignment_id (FK to load_assignments)
  └─ ... (charge details)
```

### Row-Level Security (RLS)

**Every table** has RLS policies that filter by `user_id`:

```sql
-- Example policy for trucks table
CREATE POLICY "Users can view own trucks"
ON trucks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trucks"
ON trucks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trucks"
ON trucks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trucks"
ON trucks FOR DELETE
USING (auth.uid() = user_id);
```

**Benefits**:
- Automatic data isolation at database level
- No risk of cross-user data leaks
- No need for manual `WHERE user_id = ?` clauses in queries

### Database Functions & Triggers

#### Auto-update Timestamps
```sql
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trucks_updated_at
BEFORE UPDATE ON trucks
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();
```

Applied to all tables with `updated_at` column.

### Storage Buckets

#### truck-images
- **Access**: Public
- **Purpose**: Store truck and driver photos
- **Max file size**: 5MB
- **Allowed types**: JPEG, PNG, WebP

#### expense-receipts
- **Access**: Public
- **Purpose**: Store expense receipt images/PDFs
- **Max file size**: 10MB
- **Allowed types**: JPEG, PNG, PDF

### Enums (Custom Types)

```sql
CREATE TYPE load_status AS ENUM (
  'pending',
  'assigned',
  'in_transit',
  'delivered',
  'completed'
);

CREATE TYPE truck_type AS ENUM (
  'open',
  'container',
  'trailer'
);

CREATE TYPE payment_method AS ENUM (
  'cash',
  'upi',
  'bank_transfer',
  'cheque'
);

CREATE TYPE transaction_type AS ENUM (
  'advance_from_provider',
  'balance_from_provider',
  'advance_to_driver',
  'balance_to_driver',
  'commission'
);
```

## Core Business Logic

### Financial Calculations Module

Located in `src/lib/financialCalculations.ts`, this module handles all financial computations.

#### Key Functions

1. **isInflow(transactionType: string): boolean**
   - Determines if transaction adds to cash balance
   - Returns `true` for provider payments and commissions
   - Used in cash flow calculations

2. **isOutflow(transactionType: string): boolean**
   - Determines if transaction reduces cash balance
   - Returns `true` for driver payments
   - Used in cash flow calculations

3. **calculateLoadFinancials(load, assignment, transactions, expenses, charges)**
   - **Input**: Load data, assignment data, all related transactions/expenses/charges
   - **Output**: Financial summary object
   - **Logic**:
     ```typescript
     if (payment_model === 'commission_only') {
       totalRevenue = commission_received + charges_from_party
       totalCosts = expenses + charges_to_supplier
     } else {
       totalRevenue = received_from_provider + charges_from_party
       totalCosts = paid_to_driver + expenses + charges_to_supplier
     }
     netProfit = totalRevenue - totalCosts
     ```

4. **getCashBalanceByMethod(transactions, expenses, method)**
   - Calculates net balance for specific payment method
   - Formula: `Inflows(method) - Outflows(method) - Expenses(method)`

5. **getPartialPaymentProgress(transactions, transactionType, targetAmount)**
   - Tracks progress of partial payments
   - Returns percentage complete, remaining amount, payment list

### Transaction Workflow Logic

The `TransactionWorkflowDialog` component orchestrates the complete payment lifecycle:

```
1. Create Load (status: 'pending')
      ↓
2. Assign Truck (status: 'assigned')
      ↓
3. Record Transactions (multiple steps):
   ├─ Advance from Provider (partial payments allowed)
   ├─ Balance from Provider
   ├─ Advance to Driver (partial payments allowed)
   ├─ Balance to Driver
   └─ Commission (if commission model)
      ↓
4. Add Expenses (fuel, tolls, etc.)
      ↓
5. Add Charges (detention, extra weight, etc.)
      ↓
6. Mark Complete (status: 'completed')
   ├─ Truck becomes active again
   └─ Final settlement recorded
```

## Styling & Design System

### Tailwind CSS Configuration

**Semantic tokens** defined in `src/index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}
```

All colors use **HSL format** for easy manipulation.

### Component Styling Pattern

```typescript
// ❌ Avoid direct colors
<div className="bg-blue-500 text-white">

// ✅ Use semantic tokens
<div className="bg-primary text-primary-foreground">

// ✅ Use design system for status colors
<Badge variant="success">Active</Badge>
<Badge variant="destructive">Inactive</Badge>
```

## Performance Optimizations

### Code Splitting
- Lazy load route components: `const Dashboard = React.lazy(() => import('./pages/Dashboard'))`
- Reduce initial bundle size

### Query Optimization
- Use `select()` to fetch only needed columns
- Implement pagination for large lists (100+ items)
- Batch related queries with `Promise.all()`

### Caching Strategy
- TanStack Query caches all server data
- Stale time: 5 minutes (default)
- Refetch on window focus disabled for stability

### Image Optimization
- Compress images before upload
- Use WebP format when possible
- Implement lazy loading for images in lists

## Security Architecture

### Authentication Flow

```
1. User visits protected route
      ↓
2. AppLayout checks session
      ↓
3. If no session → Redirect to /auth
      ↓
4. User logs in → Session stored in localStorage
      ↓
5. Redirect to requested route
      ↓
6. All Supabase calls include auth token automatically
```

### Data Security Layers

1. **Row-Level Security (RLS)**: Database-level filtering by `user_id`
2. **Client validation**: React Hook Form + Zod schemas
3. **Ownership checks**: Update/delete operations verify `user_id`
4. **Secure file uploads**: Scoped to user directory, type/size validation

## Deployment Architecture

### Development Environment
```bash
npm run dev  # Vite dev server on localhost:8080
```

### Production Build
```bash
npm run build  # Creates optimized build in dist/
```

### Hosting (via Lovable)
- Automatic deployment on git push to main
- Frontend served via CDN
- Backend (Supabase) auto-scales
- Environment variables managed by Lovable

## Error Handling Strategy

### API Errors
```typescript
try {
  const { data, error } = await supabase.from("loads").select("*");
  if (error) throw error;
  return data;
} catch (error: any) {
  console.error("Error:", error.message);
  toast.error(error.message || "Failed to fetch loads");
  return [];
}
```

### Form Validation
```typescript
const schema = z.object({
  truck_number: z.string().min(1, "Required"),
  carrying_capacity: z.number().positive("Must be positive"),
});
```

### Loading States
```typescript
{isLoading ? (
  <Skeleton className="h-32 w-full" />
) : (
  <DataComponent data={data} />
)}
```

## Testing Strategy

### Current State
- Manual testing via browser
- ESLint for code quality
- TypeScript for type safety

### Future Enhancements
- Unit tests with Vitest
- Component tests with React Testing Library
- E2E tests with Playwright
- Load testing for financial calculations

## Monitoring & Debugging

### Browser DevTools
- **Console**: React errors, API failures
- **Network**: Supabase API calls
- **Application**: Session storage, localStorage
- **React DevTools**: Component tree, props, state

### Lovable Cloud Dashboard
- Database queries and performance
- API usage and rate limits
- Error logs
- User analytics

## Scalability Considerations

### Current Capacity
- Single-tenant architecture
- Suitable for small to medium businesses
- Handles thousands of loads per user

### Future Scaling
- Add database indexes for frequently queried fields
- Implement server-side pagination for large datasets
- Consider database replication for read-heavy workloads
- Add caching layer (Redis) for frequently accessed data

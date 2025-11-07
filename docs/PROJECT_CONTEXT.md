# FreightFlow - Project Context for AI Development

## Project Identity
- **Name**: FreightFlow
- **Purpose**: Logistics management system for truck parking and freight business operations
- **Version**: 0.0.0
- **Tech Stack**: React 18.3, TypeScript 5.8, Vite 5.4, Tailwind CSS 3.4, Supabase 2.76
- **UI Framework**: shadcn/ui (Radix UI primitives)
- **State Management**: TanStack Query v5
- **Backend**: Lovable Cloud (Supabase)
- **Authentication**: Supabase Auth (email/password with auto-confirm)
- **Database**: PostgreSQL with Row-Level Security (RLS)
- **File Storage**: Supabase Storage (truck-images, expense-receipts)

## Business Domain

FreightFlow is a comprehensive logistics management system that handles the entire lifecycle of freight operations. It manages:

1. **Trucks**: Fleet registry with owner, driver, capacity, type, and real-time status tracking
2. **Load Providers**: Clients/parties who provide loads (shipments)
3. **Loads**: Material transport jobs from loading to unloading location
4. **Load Assignments**: Connecting loads to trucks with financial tracking
5. **Transactions**: Payment flows including advances, balances, and commissions
6. **Expenses**: Operational costs (fuel, maintenance, tolls, loading charges, etc.)
7. **Charges**: Additional fees charged to party or supplier (detention, extra weight, etc.)
8. **Financial Tracking**: Multi-method cash flow (Cash, UPI, Bank Transfer, Cheque)

## Payment Models

### 1. Standard Model (Default)
You handle all payments between provider and driver:
- **Provider pays you**: `provider_freight` (total amount)
- **You pay driver**: `truck_freight` (total amount)
- **Profit calculation**: `provider_freight - truck_freight - expenses + charges_from_party - charges_to_supplier`
- **Cash flow**: Track advances and balances separately for both provider and driver

### 2. Commission Only Model
Party pays driver directly, you only receive commission:
- **Party pays driver**: Direct payment (you don't handle this)
- **You receive**: `commission_amount` or `commission_percentage` of load value
- **Profit calculation**: `commission - expenses + charges_from_party - charges_to_supplier`
- **Cash flow**: Only track commission received and your expenses

## User Roles
- **Single-tenant application**: One user per account (no multi-user support currently)
- **Permissions**: All data scoped to `user_id` via Row-Level Security policies
- **Authentication**: Email/password with persistent sessions

## Key Features

### Dashboard & Analytics
- Real-time KPIs: Total trucks, loads, revenue, profit
- Cash flow tracking by payment method (Cash/UPI/Bank)
- Top providers with outstanding payments
- Quick payment actions
- Active operations overview

### Fleet Management
- Truck registry with detailed specifications
- Driver and owner information
- Third-party truck tracking
- Status management (Active, Assigned, Maintenance)
- Load history per truck
- Photo uploads for trucks and drivers

### Load Management
- Create loads with provider, route, material details
- Assign trucks to loads
- Track load lifecycle: Pending → Assigned → In Transit → Delivered → Completed
- Transaction workflow with step-by-step payment tracking
- Partial payment support (multiple advances before balance)
- Edit/delete transactions with financial recalculation

### Financial Operations
- Multi-transaction tracking (advances, balances)
- Expense management with receipt uploads
- Additional charges to party or supplier
- Real-time balance calculations
- Cash balance by payment method
- Outstanding payment tracking
- Quick payment dialogs

### Reporting
- Driver Balance Sheet (payment status per driver)
- Party Balance Sheet (outstanding amounts per provider)
- Daily Load Report with filters
- PDF export functionality
- Date range filtering

### Security & Data Isolation
- Row-Level Security on all tables
- User-specific data access only
- Edit/delete operations validate ownership
- Auto-confirm email signups (no verification emails)

## Technical Architecture

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **TanStack Query** for server state management and caching
- **React Router v6** for navigation with protected routes
- **shadcn/ui** for accessible, customizable UI components
- **Tailwind CSS** with semantic color tokens and HSL colors
- **React Hook Form + Zod** for form validation

### Backend (Lovable Cloud)
- **PostgreSQL** database with automatic backups
- **Supabase Auth** for user authentication
- **Row-Level Security** for data isolation
- **Supabase Storage** for file uploads (public buckets)
- **Real-time capabilities** (optional subscription support)

### Database Tables
1. **profiles** - Extended user information
2. **trucks** - Fleet registry
3. **load_providers** - Client database
4. **loads** - Shipment records
5. **load_assignments** - Load-to-truck mapping with financials
6. **transactions** - Payment records (all types)
7. **expenses** - Operational costs
8. **charges** - Additional fees

### File Structure
```
src/
├── pages/              # Route components (Dashboard, Trucks, Loads, etc.)
├── components/
│   ├── layout/         # AppLayout with sidebar
│   ├── dashboard/      # Dashboard widgets
│   ├── trucks/         # Fleet management components
│   ├── load-providers/ # Provider management
│   ├── loads/          # Load workflow components (core business logic)
│   ├── reports/        # Report generation
│   ├── common/         # Shared components (SearchBar, DateRangePicker)
│   └── ui/             # shadcn/ui primitives
├── lib/
│   ├── utils.ts                    # Utility functions
│   └── financialCalculations.ts   # Core business logic for profit/balance
├── integrations/supabase/
│   ├── client.ts       # Supabase client (auto-generated)
│   └── types.ts        # Database TypeScript types (auto-generated)
└── hooks/
    ├── use-mobile.tsx  # Responsive breakpoint hook
    └── use-toast.ts    # Toast notification system
```

## Core Business Logic

The `src/lib/financialCalculations.ts` file contains all financial calculation logic:

### Key Functions

1. **isInflow(transactionType)**: Determines if transaction adds to cash balance
   - Returns `true` for: `advance_from_provider`, `balance_from_provider`, `commission`

2. **isOutflow(transactionType)**: Determines if transaction removes from cash balance
   - Returns `true` for: `advance_to_driver`, `balance_to_driver`

3. **calculateLoadFinancials(load, assignment, transactions, expenses, charges)**
   - Calculates: Total revenue, total costs, net profit, cash in hand, balances to receive/pay
   - Handles both payment models (standard vs commission-only)
   - Accounts for charges (from party vs to supplier)
   - Returns comprehensive financial object

4. **getCashBalanceByMethod(transactions, expenses, method)**
   - Calculates net balance for specific payment method (Cash, UPI, Bank)
   - Formula: Inflows via method - Outflows via method
   - Includes both transactions and expenses

5. **getPartialPaymentProgress(transactions, transactionType, targetAmount)**
   - Tracks progress of partial payments (e.g., multiple advances)
   - Returns: payments array, total paid, remaining amount, percentage complete
   - Used in PartialPaymentTracker component for progress visualization

## User Workflows

### Creating and Completing a Load

1. **Create Load**
   - Navigate to Loads page
   - Click "Create Load"
   - Select provider, enter route details, material info
   - Set provider freight and payment model
   - Load created with status "Pending"

2. **Assign Truck**
   - Open load details
   - Click "Assign Truck"
   - Select available truck from list
   - Enter truck freight (what you'll pay driver)
   - Optional: Set commission percentage/amount
   - Truck status changes to "Assigned"
   - Load status changes to "Assigned"

3. **Manage Transactions (Transaction Workflow)**
   - Click "Manage Transactions" on load
   - Visual workflow appears with steps:
     - Advance from Provider (can add multiple)
     - Balance from Provider
     - Advance to Driver (can add multiple)
     - Balance to Driver
     - Commission (if commission model)
   - Add expenses (fuel, tolls, etc.) with receipts
   - Add charges (detention, extra weight, etc.)
   - Each step shows progress bar and payment list
   - Edit/delete individual payments as needed
   - Financial summary updates in real-time

4. **Mark Complete**
   - All payments settled (100% progress on key steps)
   - Click "Mark as Complete"
   - Load status changes to "Completed"
   - Truck becomes "Active" again (available for new loads)
   - Final settlement recorded

### Recording Transactions

- **From Transaction Workflow**: Step-by-step guided process
- **From Transactions Page**: View all transactions, edit/delete with 3-dot menu
- **From Dashboard**: Quick payment for providers with outstanding balances

### Generating Reports

1. Navigate to Reports page
2. Select report type (Driver Balance, Party Balance, Daily Load)
3. Set date range and filters
4. Preview report data
5. Click "Download PDF" or "Share" for individual entries
6. Report generates with formatted table and totals

## Development Workflow

### Adding a New Feature

1. **Plan**: Review existing architecture and identify affected components
2. **Database**: If schema changes needed, create migration in `supabase/migrations/`
3. **Types**: After migration, TypeScript types auto-update in `src/integrations/supabase/types.ts`
4. **Components**: Create focused components in appropriate directory
5. **Logic**: Add business logic to `src/lib/` if reusable
6. **UI**: Use shadcn/ui components and semantic Tailwind tokens
7. **State**: Use TanStack Query for server state, React state for UI
8. **Testing**: Test manually with different scenarios
9. **Documentation**: Update relevant docs in `docs/` directory

### Code Style Guidelines

- **Components**: PascalCase file names, default exports
- **Hooks**: camelCase with "use" prefix
- **Utilities**: camelCase function names
- **Types/Interfaces**: PascalCase, prefer interfaces for objects
- **Tailwind**: Use semantic tokens (bg-primary, text-foreground) not direct colors
- **HSL Colors**: All colors defined in HSL format in `index.css`

## Common Pitfalls to Avoid

1. **Never edit auto-generated files**:
   - `src/integrations/supabase/client.ts`
   - `src/integrations/supabase/types.ts`
   - `.env`
   - `supabase/config.toml`

2. **Always include user_id in queries**:
   - RLS policies depend on `user_id` matching `auth.uid()`
   - Updates/deletes must verify ownership

3. **Financial calculation errors**:
   - Always use `financialCalculations.ts` functions
   - Don't duplicate calculation logic in components
   - Consider both payment models in calculations

4. **Transaction editing**:
   - Recalculate all financials after edit/delete
   - Validate transaction type matches load status
   - Check for dependent records before deletion

5. **Status updates**:
   - Update truck status when assigning/completing loads
   - Update load status at each lifecycle stage
   - Keep UI in sync with backend status

## Future Enhancement Ideas

- Multi-user support with role-based permissions
- Mobile app for drivers to update load status
- Real-time GPS tracking integration
- Automated billing and invoice generation
- Advanced analytics with charts and trends
- Notification system for payment reminders
- Multi-currency support
- Fuel price tracking and optimization
- Route optimization suggestions
- Integration with accounting software

## Key Performance Metrics

- **Load Completion Time**: Average time from creation to completion
- **Truck Utilization**: Percentage of time trucks are assigned to loads
- **Profit Margin**: Average profit per load
- **Payment Collection**: Average time to receive full payment from providers
- **Outstanding Balance**: Total amount pending from all providers
- **Cash Flow**: Real-time cash position by payment method

## Support Resources

- **Internal Documentation**: `docs/` directory
- **Lovable Docs**: https://docs.lovable.dev/
- **Supabase Docs**: https://supabase.com/docs (reference only, we use Lovable Cloud)
- **React Docs**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com/

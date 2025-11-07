# FreightFlow Feature Specifications

## Complete Feature List

### 1. Authentication
- Email/password signup and login
- Auto-confirm enabled (no email verification)
- Persistent sessions via localStorage
- Automatic redirect to dashboard after login
- Sign out functionality

### 2. Dashboard KPIs
- Total Trucks (active/assigned breakdown)
- Total Loads (with active count)
- Total Revenue (provider payments + charges)
- Total Profit (calculated across loads)
- Pending Loads counter
- Active Operations counter
- Cash flow by payment method (Cash, UPI, Bank)
- Top providers with outstanding balances
- Quick payment actions

### 3. Fleet Management
- Create/edit trucks with full details
- Upload truck and driver photos
- Track truck status (Active, Assigned, Maintenance)
- View load history per truck
- Third-party truck support
- Status badges with color coding

### 4. Load Provider Management
- Create/edit providers
- Provider detail dialog with financial summary
- Transaction history per provider
- Outstanding balance tracking
- Search and filter providers

### 5. Load Management
- Create loads with route and material details
- Assign trucks to loads
- Track load lifecycle (5 statuses)
- Transaction workflow dialog
- Partial payment support
- Edit/delete transactions
- Expense tracking with receipts
- Charge management
- Real-time financial calculations

### 6. Transaction Management
- View all transactions/expenses/charges
- Filter by type, date range, payment method
- Search by load or truck
- Edit/delete with confirmation
- Financial recalculation on changes

### 7. Reports
- Driver Balance Sheet
- Party Balance Sheet
- Daily Load Report
- PDF export
- Date range filtering
- Share/download options

### 8. Payment Models
- Standard: Full payment handling
- Commission Only: Direct party-to-driver payment

### 9. Financial Features
- Multi-method cash tracking
- Partial payment progress tracking
- Real-time balance calculations
- Outstanding payment alerts
- Quick payment dialogs

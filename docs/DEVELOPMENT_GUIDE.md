# FreightFlow Development Guide

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd freightflow
npm install

# Start development
npm run dev  # Runs on localhost:8080

# Build production
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

## Project Structure

```
src/
├── pages/              # Routes
├── components/         # UI components
├── lib/               # Business logic
├── integrations/      # Supabase client (auto-generated)
└── hooks/             # Custom hooks
```

## Key Files

- **financialCalculations.ts**: Core business logic
- **supabase/client.ts**: Database client (auto-generated)
- **App.tsx**: Root with routing
- **AppLayout.tsx**: Protected route wrapper

## Database Operations

```typescript
// Query
const { data, error } = await supabase
  .from("loads")
  .select("*")
  .eq("status", "pending");

// Insert
const { data, error } = await supabase
  .from("trucks")
  .insert({ user_id: user.id, ... })
  .select()
  .single();

// Update
const { error } = await supabase
  .from("loads")
  .update({ status: "completed" })
  .eq("id", loadId);

// Delete
const { error } = await supabase
  .from("transactions")
  .delete()
  .eq("id", transactionId)
  .eq("user_id", user.id);
```

## State Management

- **TanStack Query**: Server state
- **React State**: UI state
- **React Hook Form**: Form state

## Styling

- Use semantic tokens: `bg-primary`, `text-foreground`
- All colors in HSL format
- Define tokens in `index.css`

## Best Practices

1. Never edit auto-generated files
2. Always include `user_id` in queries
3. Use `financialCalculations.ts` for money calculations
4. Validate forms with Zod schemas
5. Show loading states
6. Handle errors with toast notifications

## Common Patterns

```typescript
// Toast
toast.success("Success!");
toast.error(error.message);

// Loading
{loading ? <Skeleton /> : <Component />}

// Dialog
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>...</DialogContent>
</Dialog>
```

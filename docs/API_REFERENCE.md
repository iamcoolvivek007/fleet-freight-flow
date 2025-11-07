# FreightFlow API Reference

## Supabase Client

```typescript
import { supabase } from "@/integrations/supabase/client";
```

## Authentication

```typescript
// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Sign up
await supabase.auth.signUp({ email, password });

// Sign in
await supabase.auth.signInWithPassword({ email, password });

// Sign out
await supabase.auth.signOut();
```

## Database CRUD

### Trucks
```typescript
// Create
const { data } = await supabase
  .from("trucks")
  .insert({ user_id: user.id, truck_number: "KL07M5517", ... })
  .select()
  .single();

// Read
const { data } = await supabase
  .from("trucks")
  .select("*")
  .order("created_at", { ascending: false });

// Update
await supabase
  .from("trucks")
  .update({ is_active: false })
  .eq("id", truckId);

// Delete
await supabase
  .from("trucks")
  .delete()
  .eq("id", truckId);
```

### Loads with Relations
```typescript
const { data } = await supabase
  .from("loads")
  .select(`
    *,
    load_provider:load_providers(provider_name, phone),
    load_assignment:load_assignments(
      *,
      truck:trucks(truck_number, driver_name),
      transactions(*),
      expenses(*),
      charges(*)
    )
  `)
  .eq("id", loadId)
  .single();
```

### Transactions
```typescript
// Create
await supabase
  .from("transactions")
  .insert({
    user_id: user.id,
    load_assignment_id: assignmentId,
    transaction_type: "advance_from_provider",
    amount: 20000,
    payment_method: "cash",
    transaction_date: new Date().toISOString(),
  });

// Update
await supabase
  .from("transactions")
  .update({ amount: 25000 })
  .eq("id", transactionId)
  .eq("user_id", user.id);

// Delete
await supabase
  .from("transactions")
  .delete()
  .eq("id", transactionId)
  .eq("user_id", user.id);
```

## File Storage

```typescript
// Upload
const { data, error } = await supabase.storage
  .from("truck-images")
  .upload(`${user.id}/${Date.now()}-${file.name}`, file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from("truck-images")
  .getPublicUrl(filePath);

// Delete
await supabase.storage
  .from("truck-images")
  .remove([filePath]);
```

## Error Handling

```typescript
try {
  const { data, error } = await supabase.from("loads").select("*");
  if (error) throw error;
  return data;
} catch (error: any) {
  toast.error(error.message);
  return [];
}
```

## Performance Tips

1. Select only needed columns
2. Use pagination for large lists
3. Batch queries with `Promise.all()`
4. Add indexes for foreign keys

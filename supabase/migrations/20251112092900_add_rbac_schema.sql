-- Add role column to profiles table
ALTER TABLE public.profiles
ADD COLUMN role TEXT DEFAULT 'user' NOT NULL;

-- Create user_permissions table
CREATE TABLE public.user_permissions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  PRIMARY KEY (user_id, permission)
);

-- Enable RLS for user_permissions table
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_permissions table
-- Admins can manage all user permissions
CREATE POLICY "Admins can manage user permissions" ON public.user_permissions
  FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Users can view their own permissions
CREATE POLICY "Users can view their own permissions" ON public.user_permissions
  FOR SELECT
  USING (auth.uid() = user_id);

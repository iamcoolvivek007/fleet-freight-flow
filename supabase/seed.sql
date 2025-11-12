-- Create the admin user
INSERT INTO auth.users (id, email, encrypted_password, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@admin.com', crypt('password1', gen_salt('bf')), 'postgres');

-- Create the admin user's profile
INSERT INTO public.profiles (id, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'Admin', 'admin');

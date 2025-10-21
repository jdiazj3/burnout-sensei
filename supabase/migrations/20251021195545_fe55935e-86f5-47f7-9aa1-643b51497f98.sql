-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN email TEXT;

-- Create index for email lookups
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert profile with email
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.email
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Update existing profiles with their email from auth.users
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.user_id = au.id AND p.email IS NULL;
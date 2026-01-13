-- ========== CREATE ENUMS ==========
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('owner', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'transfer', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.stock_movement_type AS ENUM ('purchase', 'sale', 'adjustment', 'return_in', 'return_out');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.expense_category AS ENUM ('rent','utilities','marketing','fees','wages','repairs','other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========== UPDATE PROFILES TABLE ==========
-- Add new column first
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;

-- Update full_name from existing first_name and last_name
UPDATE public.profiles 
SET full_name = COALESCE(
    CASE 
        WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN first_name || ' ' || last_name
        WHEN first_name IS NOT NULL THEN first_name
        WHEN last_name IS NOT NULL THEN last_name
        ELSE split_part(email, '@', 1)
    END, 
    split_part(email, '@', 1)
)
WHERE full_name IS NULL;

-- Update any invalid role values to be enum-compatible
UPDATE public.profiles SET role = 'staff' WHERE role NOT IN ('owner', 'staff');

-- Now safely change the role column type
ALTER TABLE public.profiles 
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE public.user_role USING role::public.user_role,
  ALTER COLUMN role SET DEFAULT 'staff'::public.user_role;

-- Drop old columns
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS first_name,
  DROP COLUMN IF EXISTS last_name;

-- Update the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email IN ('owner@lostintime.com', 'admin@lostintime.com') THEN 'owner'::public.user_role
      ELSE 'staff'::public.user_role
    END,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Helper role predicate functions  
CREATE OR REPLACE FUNCTION public.is_owner(uid uuid)
RETURNS boolean 
LANGUAGE sql 
STABLE 
SECURITY DEFINER 
SET search_path = public 
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = uid AND p.role = 'owner');
$$;

CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
RETURNS boolean 
LANGUAGE sql 
STABLE 
SECURITY DEFINER 
SET search_path = public 
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = uid AND p.role IN ('owner','staff'));
$$;
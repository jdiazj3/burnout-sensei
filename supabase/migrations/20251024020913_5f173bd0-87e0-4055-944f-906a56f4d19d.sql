-- Add foreign key relationship between surveys and profiles  
-- Note: surveys.user_id references auth.users directly, but we need a way to join with profiles
-- We'll add an index to help with the JOIN operations

-- First, add an index on profiles.user_id for better JOIN performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Add an index on surveys.user_id for better JOIN performance  
CREATE INDEX IF NOT EXISTS idx_surveys_user_id ON public.surveys(user_id);
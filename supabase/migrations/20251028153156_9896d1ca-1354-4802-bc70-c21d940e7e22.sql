-- Create survey_recommendations table
CREATE TABLE public.survey_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  recommendations JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.survey_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own recommendations" 
ON public.survey_recommendations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recommendations" 
ON public.survey_recommendations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can view all recommendations
CREATE POLICY "Admins can view all recommendations" 
ON public.survey_recommendations 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Company admins can view recommendations from their company users
CREATE POLICY "Company admins can view their company recommendations" 
ON public.survey_recommendations 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'company_admin'::app_role) AND 
   user_id IN (
     SELECT profiles.user_id
     FROM profiles
     WHERE profiles.company_id IN (
       SELECT profiles.company_id
       FROM profiles
       WHERE profiles.user_id = auth.uid()
     )
   )
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_survey_recommendations_updated_at
BEFORE UPDATE ON public.survey_recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_survey_recommendations_user_id ON public.survey_recommendations(user_id);
CREATE INDEX idx_survey_recommendations_survey_id ON public.survey_recommendations(survey_id);
CREATE INDEX idx_survey_recommendations_created_at ON public.survey_recommendations(created_at DESC);
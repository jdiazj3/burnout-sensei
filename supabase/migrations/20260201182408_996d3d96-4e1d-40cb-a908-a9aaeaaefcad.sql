-- Create table for exercise sessions
CREATE TABLE public.exercise_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('bienestar', 'fisico')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  total_exercises INTEGER NOT NULL DEFAULT 0,
  completed_exercises INTEGER NOT NULL DEFAULT 0,
  score INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for chat messages within sessions
CREATE TABLE public.exercise_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.exercise_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'exercise', 'feedback', 'instruction')),
  exercise_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for exercise progress/results
CREATE TABLE public.exercise_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.exercise_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  exercise_type TEXT NOT NULL,
  user_response TEXT,
  evaluation TEXT,
  is_correct BOOLEAN,
  score INTEGER DEFAULT 0,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for exercise_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.exercise_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.exercise_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.exercise_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for exercise_messages
CREATE POLICY "Users can view messages from their sessions"
  ON public.exercise_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages in their sessions"
  ON public.exercise_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for exercise_results
CREATE POLICY "Users can view their own results"
  ON public.exercise_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own results"
  ON public.exercise_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_exercise_sessions_updated_at
  BEFORE UPDATE ON public.exercise_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_exercise_sessions_user_id ON public.exercise_sessions(user_id);
CREATE INDEX idx_exercise_messages_session_id ON public.exercise_messages(session_id);
CREATE INDEX idx_exercise_results_session_id ON public.exercise_results(session_id);
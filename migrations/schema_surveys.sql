-- Survey/Quiz Module Database Schema
-- This schema supports creating surveys/quizzes with multiple question types,
-- collecting anonymous responses, and analyzing results

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Survey Status Enum
CREATE TYPE survey_status AS ENUM ('draft', 'active', 'closed');

-- Question Type Enum
CREATE TYPE question_type AS ENUM (
  'short_text',      -- Short text input
  'long_text',       -- Long text textarea
  'multiple_choice', -- Single selection from options
  'checkboxes',      -- Multiple selections allowed
  'linear_scale'     -- Numeric scale (e.g., 1-5, 1-10)
);

-- 1. Surveys Table
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,           -- Unique code for public URL
  name VARCHAR(255) NOT NULL,                 -- Survey name
  description TEXT,                           -- Optional description
  start_date TIMESTAMPTZ NOT NULL,            -- When survey becomes active
  end_date TIMESTAMPTZ,                       -- Optional end date
  status survey_status NOT NULL DEFAULT 'draft',
  created_by UUID,                            -- Reference to admin user (auth.users)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for surveys
CREATE INDEX idx_surveys_code ON public.surveys(code);
CREATE INDEX idx_surveys_status ON public.surveys(status);
CREATE INDEX idx_surveys_start_date ON public.surveys(start_date);

-- 2. Survey Questions Table
CREATE TABLE public.survey_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,              -- Display order (0-based)
  title TEXT NOT NULL,                       -- Question title
  subtitle TEXT,                             -- Optional subtitle/description
  question_type question_type NOT NULL,
  is_required BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',               -- Type-specific settings
  -- For multiple_choice/checkboxes: {"options": ["Option 1", "Option 2"]}
  -- For linear_scale: {"min": 1, "max": 5, "minLabel": "Bad", "maxLabel": "Good"}
  -- For text: {"placeholder": "Enter your answer", "maxLength": 500}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(survey_id, order_index)
);

-- Indexes for survey questions
CREATE INDEX idx_survey_questions_survey_id ON public.survey_questions(survey_id);
CREATE INDEX idx_survey_questions_order ON public.survey_questions(survey_id, order_index);

-- 3. Survey Responses Table
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  session_id VARCHAR(100) NOT NULL,          -- Anonymous session identifier
  ip_address VARCHAR(45),                    -- IPv4 or IPv6 address
  user_agent TEXT,                           -- Browser/device info
  started_at TIMESTAMPTZ DEFAULT NOW(),      -- When user started
  completed_at TIMESTAMPTZ,                  -- When user completed (NULL if abandoned)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for survey responses
CREATE INDEX idx_survey_responses_survey_id ON public.survey_responses(survey_id);
CREATE INDEX idx_survey_responses_session_id ON public.survey_responses(session_id);
CREATE INDEX idx_survey_responses_completed ON public.survey_responses(survey_id, completed_at);

-- 4. Survey Answers Table
CREATE TABLE public.survey_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID NOT NULL REFERENCES public.survey_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  answer_value JSONB NOT NULL,               -- Flexible storage for different answer types
  -- For short_text/long_text: {"text": "user answer"}
  -- For multiple_choice: {"selected": "Option 1"}
  -- For checkboxes: {"selected": ["Option 1", "Option 3"]}
  -- For linear_scale: {"value": 4}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(response_id, question_id)
);

-- Indexes for survey answers
CREATE INDEX idx_survey_answers_response_id ON public.survey_answers(response_id);
CREATE INDEX idx_survey_answers_question_id ON public.survey_answers(question_id);

-- Trigger to update updated_at on surveys
CREATE TRIGGER update_surveys_modtime 
  BEFORE UPDATE ON public.surveys 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Trigger to update updated_at on survey_questions
CREATE TRIGGER update_survey_questions_modtime 
  BEFORE UPDATE ON public.survey_questions 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- RLS Policies
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_answers ENABLE ROW LEVEL SECURITY;

-- Public can read active surveys and their questions
CREATE POLICY "Public can view active surveys" 
  ON public.surveys 
  FOR SELECT 
  USING (status = 'active' AND start_date <= NOW() AND (end_date IS NULL OR end_date >= NOW()));

CREATE POLICY "Public can view questions of active surveys" 
  ON public.survey_questions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.surveys 
      WHERE surveys.id = survey_questions.survey_id 
        AND surveys.status = 'active' 
        AND surveys.start_date <= NOW() 
        AND (surveys.end_date IS NULL OR surveys.end_date >= NOW())
    )
  );

-- Public can insert responses and answers
CREATE POLICY "Public can submit responses" 
  ON public.survey_responses 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Public can submit answers" 
  ON public.survey_answers 
  FOR INSERT 
  WITH CHECK (true);

-- Admin policies (authenticated users with admin role can do everything)
-- Note: Adjust these based on your auth setup
-- For now, allowing authenticated users full access to admin operations

-- Helper function to check if survey is active
CREATE OR REPLACE FUNCTION is_survey_active(survey_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.surveys
    WHERE id = survey_id_param
      AND status = 'active'
      AND start_date <= NOW()
      AND (end_date IS NULL OR end_date >= NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get survey analytics summary
CREATE OR REPLACE FUNCTION get_survey_analytics(survey_id_param UUID)
RETURNS TABLE (
  total_responses BIGINT,
  completed_responses BIGINT,
  completion_rate NUMERIC,
  avg_completion_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_responses,
    COUNT(completed_at)::BIGINT as completed_responses,
    CASE 
      WHEN COUNT(*) > 0 THEN ROUND((COUNT(completed_at)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0
    END as completion_rate,
    AVG(completed_at - started_at) as avg_completion_time
  FROM public.survey_responses
  WHERE survey_id = survey_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE public.surveys IS 'Stores survey/quiz definitions';
COMMENT ON TABLE public.survey_questions IS 'Stores questions for each survey';
COMMENT ON TABLE public.survey_responses IS 'Stores user response sessions';
COMMENT ON TABLE public.survey_answers IS 'Stores individual answers to questions';
COMMENT ON COLUMN public.survey_questions.settings IS 'JSONB field for type-specific configuration (options, scale settings, etc.)';
COMMENT ON COLUMN public.survey_answers.answer_value IS 'JSONB field for flexible answer storage based on question type';

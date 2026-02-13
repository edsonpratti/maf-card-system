-- Migration: Add completion/thank you page settings to surveys table
-- Run this migration to enable customizable completion screens

-- Add columns for completion page settings
ALTER TABLE public.surveys 
ADD COLUMN IF NOT EXISTS completion_title VARCHAR(255) DEFAULT 'Obrigado!',
ADD COLUMN IF NOT EXISTS completion_subtitle TEXT DEFAULT 'Suas respostas foram enviadas com sucesso. Agradecemos sua participação!',
ADD COLUMN IF NOT EXISTS completion_show_button BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS completion_button_text VARCHAR(100) DEFAULT 'Saiba mais',
ADD COLUMN IF NOT EXISTS completion_button_url TEXT;

-- Comment on columns
COMMENT ON COLUMN public.surveys.completion_title IS 'Title shown on the completion/thank you page';
COMMENT ON COLUMN public.surveys.completion_subtitle IS 'Subtitle/description shown on the completion page';
COMMENT ON COLUMN public.surveys.completion_show_button IS 'Whether to show a CTA button on completion page';
COMMENT ON COLUMN public.surveys.completion_button_text IS 'Text for the CTA button';
COMMENT ON COLUMN public.surveys.completion_button_url IS 'URL the CTA button links to';

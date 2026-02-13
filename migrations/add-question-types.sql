-- Migration: Add new question types (name, email, phone) to question_type ENUM
-- Run this migration to enable the new question types

-- Add 'name' type to question_type enum
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'name';

-- Add 'email' type to question_type enum
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'email';

-- Add 'phone' type to question_type enum
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'phone';

-- Note: In PostgreSQL, you cannot remove values from an ENUM type
-- The new values will be added at the end of the enum
-- Order in the enum doesn't affect functionality, only application logic matters

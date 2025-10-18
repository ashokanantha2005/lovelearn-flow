-- Create assignment type enum
CREATE TYPE assignment_type AS ENUM ('file_upload', 'quiz');

-- Add new columns to assignments table
ALTER TABLE public.assignments
ADD COLUMN assignment_type assignment_type NOT NULL DEFAULT 'file_upload',
ADD COLUMN questions JSONB; -- Stores quiz structure

-- Add new columns to submissions table
ALTER TABLE public.submissions
ADD COLUMN answers JSONB; -- Stores student's answers

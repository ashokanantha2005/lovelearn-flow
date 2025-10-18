-- Add assignment type column to assignments table
ALTER TABLE public.assignments
ADD COLUMN assignment_type TEXT NOT NULL DEFAULT 'file_upload'; -- Or create an ENUM type

-- Add questions column (JSONB) to assignments table
ALTER TABLE public.assignments
ADD COLUMN questions JSONB;

-- Add answers column (JSONB) to submissions table
ALTER TABLE public.submissions
ADD COLUMN answers JSONB;

-- Make original submission fields nullable if needed
ALTER TABLE public.submissions
ALTER COLUMN file_url DROP NOT NULL,
ALTER COLUMN notes DROP NOT NULL;

-- Add policies (adjust SELECT policies if needed to include new columns)
-- Ensure teachers can insert/update assignment_type and questions
-- Ensure students can insert/update answers
-- Ensure students/teachers can view answers, questions, assignment_type appropriately
-- Example (adjust existing policies or add new ones as needed):
-- Recreate or ALTER INSERT policy for submissions to allow inserting 'answers'
-- Recreate or ALTER SELECT policy for submissions to allow viewing 'answers'

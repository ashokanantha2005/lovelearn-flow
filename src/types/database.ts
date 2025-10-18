export type UserRole = 'student' | 'teacher';

// New types for quiz structure
export type AssignmentType = 'file_upload' | 'quiz';
export type QuestionType = 'multiple_choice' | 'descriptive';

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  text: string;
  // Only for multiple_choice
  options?: QuizOption[];
  // Only for multiple_choice. Stores the ID(s) of the correct option(s)
  correct_options?: string[];
  // Only for descriptive questions (optional max length)
  max_length?: number;
  // Used for any type
  max_marks: number;
}

export interface QuizAnswer {
  question_id: string;
  // For multiple_choice: array of selected option IDs (assuming single-choice for this example)
  selected_options?: string[];
  // For descriptive: student's text
  descriptive_answer?: string;
}
// End new types for quiz structure

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  duration?: string;
  image_url?: string;
  tags?: string[];
  teacher_id: string;
  created_at: string;
  updated_at: string;
  teacher?: Profile;
}

export interface Enrollment {
  id: string;
  course_id: string;
  student_id: string;
  progress: number;
  enrolled_at: string;
  course?: Course;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string;
  deadline?: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
  course?: Course;
  // New fields
  assignment_type: AssignmentType;
  questions?: QuizQuestion[];
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url?: string;
  notes?: string;
  submitted_at: string;
  assignment?: Assignment;
  student?: Profile;
  grade?: Grade;
  // New field
  answers?: QuizAnswer[];
}

export interface Grade {
  id: string;
  submission_id: string;
  teacher_id: string;
  marks: number;
  max_marks: number;
  feedback?: string;
  graded_at: string;
}

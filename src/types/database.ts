export type UserRole = 'student' | 'teacher';

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

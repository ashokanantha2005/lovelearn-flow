import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Enrollment, Course } from '@/types/database';
import { BookOpen, Clock, User, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MyCourses() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<(Enrollment | Course)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'student') {
        fetchEnrollments();
      } else {
        fetchTeacherCourses();
      }
    }
  }, [user, profile]);

  const fetchEnrollments = async () => {
    try {
      const { data: enrollmentsData, error } = await supabase
        .from('enrollments')
        .select('*, course:courses(*, teacher:profiles!courses_teacher_id_fkey(*))')
        .eq('student_id', user!.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      setData(enrollmentsData || []);
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherCourses = async () => {
    try {
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('teacher_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(coursesData || []);
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async (enrollmentId: string) => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (error) throw error;
      toast.success('Unenrolled successfully');
      fetchEnrollments();
    } catch (error) {
      toast.error('Failed to unenroll');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Courses</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const isStudent = profile?.role === 'student';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isStudent ? 'My Enrolled Courses' : 'My Courses'}
          </h1>
          <p className="text-muted-foreground">
            {isStudent
              ? 'Continue your learning journey'
              : 'Manage and view your courses'}
          </p>
        </div>
        {!isStudent && (
          <Button asChild className="hover-lift">
            <Link to="/dashboard/create-course">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Course
            </Link>
          </Button>
        )}
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-4">
              {isStudent
                ? "You haven't enrolled in any courses yet"
                : "You haven't created any courses yet"}
            </p>
            <Button asChild>
              <Link to={isStudent ? '/' : '/dashboard/create-course'}>
                {isStudent ? 'Browse Courses' : 'Create Your First Course'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item) => {
            const course = isStudent ? (item as Enrollment).course : (item as Course);
            const enrollment = isStudent ? (item as Enrollment) : null;

            return (
              <Card key={item.id} className="hover-scale overflow-hidden group">
                {course?.image_url && (
                  <div className="h-40 overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                    <img
                      src={course.image_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{course?.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course?.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course?.tags && course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {course.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 text-sm text-muted-foreground">
                    {course?.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </div>
                    )}
                    {isStudent && course?.teacher && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {course.teacher.name}
                      </div>
                    )}
                  </div>

                  {enrollment && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{enrollment.progress}%</span>
                      </div>
                      <Progress value={enrollment.progress} className="h-2" />
                    </div>
                  )}

                  <div className="flex gap-2">
                    {isStudent ? (
                      <>
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link to={`/course/${course?.id}`}>View Details</Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnenroll(item.id)}
                        >
                          Unenroll
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link to={`/dashboard/courses/${item.id}`}>Manage Course</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

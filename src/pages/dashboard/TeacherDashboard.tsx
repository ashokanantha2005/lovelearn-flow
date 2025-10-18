import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Course, Submission } from '@/types/database';
import { BookOpen, Users, ClipboardList, PlusCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('teacher_id', user!.id)
        .order('created_at', { ascending: false });

      setCourses(coursesData || []);

      if (coursesData && coursesData.length > 0) {
        // Fetch total students
        const { count } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .in(
            'course_id',
            coursesData.map((c) => c.id)
          );

        setTotalStudents(count || 0);

        // Fetch pending submissions (not graded)
        const { data: submissionsData } = await supabase
          .from('submissions')
          .select('*, assignment:assignments(*, course:courses(*)), student:profiles(*)')
          .in(
            'assignment_id',
            (
              await supabase
                .from('assignments')
                .select('id')
                .in(
                  'course_id',
                  coursesData.map((c) => c.id)
                )
            ).data?.map((a) => a.id) || []
          )
          .is('grade', null)
          .order('submitted_at', { ascending: false })
          .limit(5);

        setPendingSubmissions(submissionsData || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Teacher Dashboard 👨‍🏫</h1>
        <p className="text-muted-foreground">Manage your courses and students</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-scale transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>

        <Card className="hover-scale transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>

        <Card className="hover-scale transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSubmissions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your teaching activities</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button asChild className="h-auto py-6 hover-lift">
            <Link to="/dashboard/create-course" className="flex flex-col items-center gap-2">
              <PlusCircle className="h-6 w-6" />
              <span>Create New Course</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-auto py-6 hover-lift">
            <Link to="/dashboard/submissions" className="flex flex-col items-center gap-2">
              <ClipboardList className="h-6 w-6" />
              <span>Review Submissions</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* My Courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>Courses you're currently teaching</CardDescription>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/dashboard/courses">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You haven't created any courses yet</p>
              <Button asChild>
                <Link to="/dashboard/create-course">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Course
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.slice(0, 4).map((course) => (
                <Link
                  key={course.id}
                  to={`/dashboard/courses/${course.id}`}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-smooth"
                >
                  <h3 className="font-medium mb-2">{course.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {course.description}
                  </p>
                  {course.tags && course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {course.tags.slice(0, 2).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Submissions */}
      {pendingSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Submissions</CardTitle>
            <CardDescription>Review and grade student submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingSubmissions.map((submission) => (
                <Link
                  key={submission.id}
                  to="/dashboard/submissions"
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-smooth"
                >
                  <div>
                    <h3 className="font-medium">{submission.assignment?.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      by {submission.student?.name} • {submission.assignment?.course?.title}
                    </p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Enrollment, Assignment, Submission } from '@/types/database';
import { BookOpen, FileText, Award, TrendingUp, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>([]);
  const [recentGrades, setRecentGrades] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch enrollments
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select('*, course:courses(*)')
        .eq('student_id', user!.id)
        .order('enrolled_at', { ascending: false })
        .limit(3);

      setEnrollments(enrollmentsData || []);

      // Fetch pending assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*, course:courses(*)')
        .in(
          'course_id',
          (enrollmentsData || []).map((e) => e.course_id)
        )
        .order('deadline', { ascending: true })
        .limit(5);

      // Filter out submitted assignments
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('assignment_id')
        .eq('student_id', user!.id);

      const submittedIds = new Set(submissionsData?.map((s) => s.assignment_id) || []);
      const pending = (assignmentsData || []).filter((a) => !submittedIds.has(a.id));

      setPendingAssignments(pending);

      // Fetch recent grades
      const { data: gradesData } = await supabase
        .from('submissions')
        .select('*, assignment:assignments(*, course:courses(*)), grade:grades(*)')
        .eq('student_id', user!.id)
        .not('grade', 'is', null)
        .order('submitted_at', { ascending: false })
        .limit(3);

      setRecentGrades(gradesData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const averageProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
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
        <h1 className="text-3xl font-bold mb-2">Welcome Back! 👋</h1>
        <p className="text-muted-foreground">Here's your learning overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-scale transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
          </CardContent>
        </Card>

        <Card className="hover-scale transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAssignments.length}</div>
          </CardContent>
        </Card>

        <Card className="hover-scale transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Grades</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentGrades.length}</div>
          </CardContent>
        </Card>

        <Card className="hover-scale transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageProgress}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>Continue your learning journey</CardDescription>
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
          {enrollments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet</p>
              <Button asChild>
                <Link to="/">Browse Courses</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-smooth"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{enrollment.course?.title}</h3>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{enrollment.progress}%</span>
                      </div>
                      <Progress value={enrollment.progress} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Assignments */}
      {pendingAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Assignments</CardTitle>
            <CardDescription>Complete these assignments before the deadline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingAssignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  to="/dashboard/assignments"
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-smooth"
                >
                  <div>
                    <h3 className="font-medium">{assignment.title}</h3>
                    <p className="text-sm text-muted-foreground">{assignment.course?.title}</p>
                  </div>
                  {assignment.deadline && (
                    <span className="text-sm text-muted-foreground">
                      Due: {new Date(assignment.deadline).toLocaleDateString()}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

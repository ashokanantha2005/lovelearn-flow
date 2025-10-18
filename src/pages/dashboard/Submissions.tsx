import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Submission } from '@/types/database';
import { ClipboardList, User, FileText, Calendar, Award } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Submissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [marks, setMarks] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [feedback, setFeedback] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  const fetchSubmissions = async () => {
    try {
      // Get teacher's courses
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('teacher_id', user!.id);

      if (!courses || courses.length === 0) {
        setLoading(false);
        return;
      }

      // Get assignments for these courses
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id')
        .in(
          'course_id',
          courses.map((c) => c.id)
        );

      if (!assignments || assignments.length === 0) {
        setLoading(false);
        return;
      }

      // Get submissions
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('*, assignment:assignments(*, course:courses(*)), student:profiles(*), grade:grades(*)')
        .in(
          'assignment_id',
          assignments.map((a) => a.id)
        )
        .order('submitted_at', { ascending: false });

      setSubmissions(submissionsData || []);
    } catch (error) {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async () => {
    if (!selectedSubmission || !marks || !maxMarks) {
      toast.error('Please fill in all required fields');
      return;
    }

    const marksNum = parseInt(marks);
    const maxMarksNum = parseInt(maxMarks);

    if (isNaN(marksNum) || isNaN(maxMarksNum) || marksNum < 0 || maxMarksNum <= 0 || marksNum > maxMarksNum) {
      toast.error('Please enter valid marks');
      return;
    }

    setGrading(true);
    try {
      const { error } = await supabase.from('grades').insert({
        submission_id: selectedSubmission.id,
        teacher_id: user!.id,
        marks: marksNum,
        max_marks: maxMarksNum,
        feedback: feedback.trim() || null,
      });

      if (error) throw error;

      toast.success('Grade submitted successfully!');
      setDialogOpen(false);
      setMarks('');
      setMaxMarks('100');
      setFeedback('');
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit grade');
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Submissions</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-2/3 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const pendingSubmissions = submissions.filter((s) => !s.grade);
  const gradedSubmissions = submissions.filter((s) => s.grade);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Student Submissions</h1>
        <p className="text-muted-foreground">Review and grade student work</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSubmissions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Graded</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradedSubmissions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Submissions */}
      {pendingSubmissions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Pending Reviews</h2>
          <div className="space-y-4">
            {pendingSubmissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3">
                        {submission.assignment?.title}
                        <Badge variant="outline">Pending Review</Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {submission.assignment?.course?.title}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {submission.student?.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                    </div>
                  </div>

                  {submission.notes && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Student Notes:</p>
                      <p className="text-sm">{submission.notes}</p>
                    </div>
                  )}

                  {submission.file_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={submission.file_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="mr-2 h-4 w-4" />
                        View Attachment
                      </a>
                    </Button>
                  )}

                  <Dialog open={dialogOpen && selectedSubmission?.id === submission.id} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                      setSelectedSubmission(null);
                      setMarks('');
                      setMaxMarks('100');
                      setFeedback('');
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => setSelectedSubmission(submission)}
                        className="hover-lift"
                      >
                        <Award className="mr-2 h-4 w-4" />
                        Grade Submission
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Grade Submission</DialogTitle>
                        <DialogDescription>
                          Grading {submission.student?.name}'s work
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="marks">Marks Obtained *</Label>
                            <Input
                              id="marks"
                              type="number"
                              min="0"
                              placeholder="85"
                              value={marks}
                              onChange={(e) => setMarks(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="maxMarks">Total Marks *</Label>
                            <Input
                              id="maxMarks"
                              type="number"
                              min="1"
                              value={maxMarks}
                              onChange={(e) => setMaxMarks(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="feedback">Feedback (Optional)</Label>
                          <Textarea
                            id="feedback"
                            placeholder="Provide feedback to the student..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <Button
                          onClick={handleGrade}
                          disabled={grading}
                          className="w-full"
                        >
                          {grading ? 'Submitting...' : 'Submit Grade'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Graded Submissions */}
      {gradedSubmissions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recently Graded</h2>
          <div className="space-y-4">
            {gradedSubmissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3">
                        {submission.assignment?.title}
                        <Badge className="bg-success">Graded</Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {submission.assignment?.course?.title}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {submission.student?.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Graded: {new Date(submission.grade!.graded_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Grade</span>
                      <span className="text-lg font-bold">
                        {submission.grade!.marks}/{submission.grade!.max_marks}
                      </span>
                    </div>
                    {submission.grade!.feedback && (
                      <p className="text-sm text-muted-foreground">
                        {submission.grade!.feedback}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {submissions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">No submissions yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

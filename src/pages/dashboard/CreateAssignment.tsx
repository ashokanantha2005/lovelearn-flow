import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Assignment, Submission } from '@/types/database';
import { FileText, Calendar, CheckCircle, Clock, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface AssignmentWithStatus extends Assignment {
  submission?: Submission;
}

export default function Assignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      // Get enrolled courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user!.id);

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      // Get assignments for enrolled courses
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*, course:courses(*)')
        .in(
          'course_id',
          enrollments.map((e) => e.course_id)
        )
        .order('deadline', { ascending: true });

      // Get submissions
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('*, grade:grades(*)')
        .eq('student_id', user!.id);

      // Merge data
      const merged = (assignmentsData || []).map((assignment) => ({
        ...assignment,
        submission: submissionsData?.find((s) => s.assignment_id === assignment.id),
      }));

      setAssignments(merged);
    } catch (error) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment || !notes.trim()) {
      toast.error('Please provide notes for your submission');
      return;
    }

    setSubmitting(true);
    try {
      let fileUrl = null;

      // Upload file if provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user!.id}/${selectedAssignment.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('submissions')
          .getPublicUrl(fileName);

        fileUrl = publicUrl;
      }

      // Create submission
      const { error } = await supabase.from('submissions').insert({
        assignment_id: selectedAssignment.id,
        student_id: user!.id,
        notes,
        file_url: fileUrl,
      });

      if (error) throw error;

      toast.success('Assignment submitted successfully!');
      setDialogOpen(false);
      setNotes('');
      setFile(null);
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (assignment: AssignmentWithStatus) => {
    if (assignment.submission) {
      if (assignment.submission.grade) {
        return <Badge className="bg-success">Graded</Badge>;
      }
      return <Badge variant="secondary">Submitted</Badge>;
    }
    if (assignment.deadline && new Date(assignment.deadline) < new Date()) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Assignments</h1>
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Assignments</h1>
        <p className="text-muted-foreground">View and submit your assignments</p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">No assignments available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3">
                      {assignment.title}
                      {getStatusBadge(assignment)}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {assignment.course?.title}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{assignment.description}</p>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  {assignment.deadline && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Due: {new Date(assignment.deadline).toLocaleDateString()}
                    </div>
                  )}
                  {assignment.submission && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Submitted: {new Date(assignment.submission.submitted_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {assignment.submission?.grade && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Your Grade</span>
                      <span className="text-lg font-bold">
                        {assignment.submission.grade.marks}/{assignment.submission.grade.max_marks}
                      </span>
                    </div>
                    {assignment.submission.grade.feedback && (
                      <p className="text-sm text-muted-foreground">
                        {assignment.submission.grade.feedback}
                      </p>
                    )}
                  </div>
                )}

                {!assignment.submission && (
                  <Dialog open={dialogOpen && selectedAssignment?.id === assignment.id} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                      setSelectedAssignment(null);
                      setNotes('');
                      setFile(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => setSelectedAssignment(assignment)}
                        className="hover-lift"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Submit Assignment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submit Assignment</DialogTitle>
                        <DialogDescription>
                          Submit your work for: {assignment.title}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes *</Label>
                          <Textarea
                            id="notes"
                            placeholder="Add any notes about your submission..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="file">Attachment (Optional)</Label>
                          <Input
                            id="file"
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                          />
                        </div>
                        <Button
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="w-full"
                        >
                          {submitting ? 'Submitting...' : 'Submit'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import CourseDetail from "./pages/CourseDetail";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import TeacherDashboard from "./pages/dashboard/TeacherDashboard";
import MyCourses from "./pages/dashboard/MyCourses";
import CreateCourse from "./pages/dashboard/CreateCourse";
import Assignments from "./pages/dashboard/Assignments";
import Submissions from "./pages/dashboard/Submissions";
import NotFound from "./pages/NotFound";
import { useAuth } from "./hooks/useAuth";
import CreateAssignment from "./pages/dashboard/CreateAssignment"; // ADDED

const queryClient = new QueryClient();

const DashboardRedirect = () => {
  const { profile } = useAuth();
  
  if (profile?.role === 'student') {
    return <StudentDashboard />;
  }
  return <TeacherDashboard />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/course/:id" element={<CourseDetail />} />
          
          <Route path="/dashboard" element={<DashboardLayout><DashboardRedirect /></DashboardLayout>} />
          <Route path="/dashboard/courses" element={<DashboardLayout><MyCourses /></DashboardLayout>} />
          <Route path="/dashboard/create-course" element={<DashboardLayout><CreateCourse /></DashboardLayout>} />
          <Route path="/dashboard/assignments" element={<DashboardLayout><Assignments /></DashboardLayout>} />
          <Route path="/dashboard/submissions" element={<DashboardLayout><Submissions /></DashboardLayout>} />
          <Route path="/dashboard/students" element={<DashboardLayout><div className="text-center py-12 text-muted-foreground">Students page coming soon</div></DashboardLayout>} />
          <Route path="/dashboard/grades" element={<DashboardLayout><div className="text-center py-12 text-muted-foreground">Grades page coming soon</div></DashboardLayout>} />
          <Route path="/dashboard/notifications" element={<DashboardLayout><div className="text-center py-12 text-muted-foreground">Notifications page coming soon</div></DashboardLayout>} />
          <Route path="/course/:id" element={<CourseDetail />} />
  
          <Route path="/dashboard" element={<DashboardLayout><DashboardRedirect /></DashboardLayout>} />
          <Route path="/dashboard/courses" element={<DashboardLayout><MyCourses /></DashboardLayout>} />
          <Route path="/dashboard/create-course" element={<DashboardLayout><CreateCourse /></DashboardLayout>} />
          <Route path="/dashboard/create-assignment" element={<DashboardLayout><CreateAssignment /></DashboardLayout>} /> {/* ADDED */}
          <Route path="/dashboard/assignments" element={<DashboardLayout><Assignments /></DashboardLayout>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

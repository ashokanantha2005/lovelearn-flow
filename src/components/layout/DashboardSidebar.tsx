import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  LayoutDashboard,
  BookMarked,
  FileText,
  Award,
  Bell,
  LogOut,
  PlusCircle,
  Users,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UserRole } from '@/types/database';

interface DashboardSidebarProps {
  role: UserRole;
}

export const DashboardSidebar = ({ role }: DashboardSidebarProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const studentLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dashboard/courses', icon: BookMarked, label: 'My Courses' },
    { to: '/dashboard/assignments', icon: FileText, label: 'Assignments' },
    { to: '/dashboard/grades', icon: Award, label: 'Grades' },
    { to: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
  ];

  const teacherLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dashboard/courses', icon: BookMarked, label: 'My Courses' },
    { to: '/dashboard/create-course', icon: PlusCircle, label: 'Create Course' },
    { to: '/dashboard/students', icon: Users, label: 'Students' },
    { to: '/dashboard/submissions', icon: ClipboardList, label: 'Submissions' },
  ];

  const links = role === 'student' ? studentLinks : teacherLinks;

  return (
    <aside className="w-64 border-r bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-sidebar-primary" />
          <span className="font-bold text-lg text-sidebar-primary">LearnFlow</span>
        </div>
        <p className="text-xs text-sidebar-foreground/70 mt-1 capitalize">{role} Portal</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/80'
              }`
            }
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </aside>
  );
};

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, LogIn, UserPlus } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              LearnFlow
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth?mode=login">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
            <Button size="sm" asChild className="hover-lift">
              <Link to="/auth?mode=signup">
                <UserPlus className="mr-2 h-4 w-4" />
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

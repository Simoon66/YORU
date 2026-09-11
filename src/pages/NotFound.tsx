import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-yoru-bg flex flex-col items-center justify-center p-6 text-center z-[1000] relative">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yoru-accent/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
      </div>
      
      <div className="relative z-10 space-y-6 max-w-md">
        <h1 className="text-8xl font-black text-white tracking-widest drop-shadow-2xl">
          404
        </h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-yoru-accent uppercase tracking-widest">
            Page Not Found
          </h2>
          <p className="text-yoru-text-muted text-sm">
            The anime or page you are looking for has been moved, deleted, or never existed in this dimension.
          </p>
        </div>
        
        <div className="pt-4 flex justify-center">
          <Link to="/home">
            <Button variant="primary" className="gap-2 rounded-full px-8">
              <Home className="w-4 h-4" /> Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

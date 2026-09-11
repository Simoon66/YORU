import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-yoru-bg flex flex-col items-center justify-center p-6 text-center z-[1000] relative">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yoru-accent/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
      </div>
      
      <div className="relative z-10 flex flex-col items-center space-y-6 max-w-md mt-12">
        {/* Zoro Image from User */}
        <motion.div 
          className="relative w-72 h-72 -mb-8 pointer-events-none"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <img src="/image.png" alt="Zoro Lost" className="w-full h-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]" />
        </motion.div>

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

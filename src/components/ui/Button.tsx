import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center font-bold uppercase tracking-widest transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-white text-[#050505] hover:bg-yoru-accent hover:text-white",
      secondary: "border border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10",
      ghost: "hover:bg-yoru-surface-elevated text-yoru-text-muted hover:text-white",
      danger: "bg-yoru-error/10 text-yoru-error hover:bg-yoru-error hover:text-white",
    };
    
    const sizes = {
      sm: "px-6 py-2 text-[10px]",
      md: "px-8 py-3 text-xs",
      lg: "px-10 py-4 text-xs",
    };
    
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

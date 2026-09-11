import { useState, useEffect, useRef } from 'react';
import { useMotionValue, animate } from 'motion/react';

export function useFramerDragScroll(itemsLength: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [constraints, setConstraints] = useState({ left: 0, right: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);

  useEffect(() => {
    const updateConstraints = () => {
      if (containerRef.current && innerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const innerWidth = innerRef.current.scrollWidth;
        setConstraints({
          left: Math.min(0, -(innerWidth - containerWidth)),
          right: 0
        });
      }
    };

    // Calculate immediately
    updateConstraints();

    // Recalculate after images / child mounts have had a bit of time
    const timer = setTimeout(updateConstraints, 500);

    window.addEventListener('resize', updateConstraints);
    return () => {
      window.removeEventListener('resize', updateConstraints);
      clearTimeout(timer);
    };
  }, [itemsLength]);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current || !innerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const innerWidth = innerRef.current.scrollWidth;
    const maxScroll = innerWidth - containerWidth;
    const currentX = x.get();
    
    let targetX = currentX + (direction === 'left' ? 1 : -1) * (containerWidth * 0.75);
    targetX = Math.max(-maxScroll, Math.min(0, targetX));
    
    animate(x, targetX, {
      type: 'spring',
      stiffness: 120,
      damping: 20,
      mass: 0.8
    });
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    // Timeout to prevent clicking links right after dragging
    setTimeout(() => {
      setIsDragging(false);
    }, 50);
  };

  return {
    containerRef,
    innerRef,
    constraints,
    x,
    isDragging,
    scroll,
    handleDragStart,
    handleDragEnd
  };
}

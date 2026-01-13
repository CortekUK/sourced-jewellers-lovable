import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface DynamicBorderCardProps {
  children: React.ReactNode;
  className?: string;
}

export const DynamicBorderCard = ({ children, className }: DynamicBorderCardProps) => {
  const topRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const animateBorder = () => {
      const now = Date.now() / 1000;
      const speed = 0.3; // Subtle, elegant speed
      
      // Calculate positions based on time
      const topX = Math.sin(now * speed) * 100;
      const rightY = Math.cos(now * speed) * 100;
      const bottomX = Math.sin(now * speed + Math.PI) * 100;
      const leftY = Math.cos(now * speed + Math.PI) * 100;
      
      // Apply positions to elements
      if (topRef.current) topRef.current.style.transform = `translateX(${topX}%)`;
      if (rightRef.current) rightRef.current.style.transform = `translateY(${rightY}%)`;
      if (bottomRef.current) bottomRef.current.style.transform = `translateX(${bottomX}%)`;
      if (leftRef.current) leftRef.current.style.transform = `translateY(${leftY}%)`;
      
      requestAnimationFrame(animateBorder);
    };
    
    const animationId = requestAnimationFrame(animateBorder);
    return () => cancelAnimationFrame(animationId);
  }, []);
  
  return (
    <div className={cn(
      "relative rounded-lg border overflow-hidden shadow-elegant",
      "bg-gray-50 dark:bg-neutral-900",
      "border-gray-200 dark:border-neutral-800",
      className
    )}>
      {/* Animated border elements */}
      <div className="absolute top-0 left-0 w-full h-[2px] overflow-hidden z-20">
        <div 
          ref={topRef}
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-primary/60 to-transparent dark:via-primary-glow/50"
        ></div>
      </div>
      
      <div className="absolute top-0 right-0 w-[2px] h-full overflow-hidden z-20">
        <div 
          ref={rightRef}
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-primary-glow/60 to-transparent dark:via-primary/50"
        ></div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full h-[2px] overflow-hidden z-20">
        <div 
          ref={bottomRef}
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-primary/60 to-transparent dark:via-primary-glow/50"
        ></div>
      </div>
      
      <div className="absolute top-0 left-0 w-[2px] h-full overflow-hidden z-20">
        <div 
          ref={leftRef}
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-primary-glow/60 to-transparent dark:via-primary/50"
        ></div>
      </div>
      
      {/* Decorative corner elements */}
      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary/60 dark:bg-primary-glow/40 animate-pulse z-10"></div>
      <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-primary-glow/60 dark:bg-primary/40 animate-pulse z-10" style={{ animationDelay: '1s' }}></div>
      
      {/* Subtle background glows */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/5 dark:bg-primary-glow/5 blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-primary-glow/5 dark:bg-primary/5 blur-3xl"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

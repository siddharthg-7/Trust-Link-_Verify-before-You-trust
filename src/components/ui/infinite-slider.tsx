"use client";

import { motion, useAnimationFrame, useMotionValue, useSpring, useTransform } from "framer-motion";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface InfiniteSliderProps {
  children: ReactNode;
  gap?: number;
  duration?: number;
  reverse?: boolean;
  className?: string;
  pauseOnHover?: boolean;
}

export function InfiniteSlider({
  children,
  gap = 40,
  duration = 20,
  reverse = false,
  className,
  pauseOnHover = true,
}: InfiniteSliderProps) {
  const [contentWidth, setContentWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setContentWidth(contentRef.current.scrollWidth);
    }
  }, [children]);

  const x = useMotionValue(0);

  useAnimationFrame((_, delta) => {
    if (contentWidth === 0) return;
    
    const moveBy = (delta / 1000) * (contentWidth / duration);
    const newX = reverse ? x.get() + moveBy : x.get() - moveBy;
    
    if (reverse) {
      if (newX >= 0) {
        x.set(-contentWidth - gap);
      } else {
        x.set(newX);
      }
    } else {
      if (newX <= -(contentWidth + gap)) {
        x.set(0);
      } else {
        x.set(newX);
      }
    }
  });

  return (
    <div 
      ref={containerRef}
      className={cn("overflow-hidden whitespace-nowrap mask-horizontal", className)}
    >
      <motion.div 
        className="inline-flex"
        style={{ x, gap: `${gap}px` }}
      >
        <div ref={contentRef} className="inline-flex" style={{ gap: `${gap}px` }}>
          {children}
        </div>
        <div className="inline-flex" style={{ gap: `${gap}px` }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

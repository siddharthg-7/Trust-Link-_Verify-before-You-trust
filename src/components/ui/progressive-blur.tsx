"use client";

import React from "react";
import { cn } from "../../lib/utils";

interface ProgressiveBlurProps {
  className?: string;
  direction?: "top" | "bottom" | "left" | "right";
  blurLayers?: number;
}

export function ProgressiveBlur({
  className,
  direction = "bottom",
  blurLayers = 8,
}: ProgressiveBlurProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 z-10", className)}>
      {[...Array(blurLayers)].map((_, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${Math.pow(2, i)}px)`,
            maskImage: `linear-gradient(to ${direction}, 
              transparent ${i * (100 / blurLayers)}%, 
              black ${(i + 1) * (100 / blurLayers)}%
            )`,
            WebkitMaskImage: `linear-gradient(to ${direction}, 
              transparent ${i * (100 / blurLayers)}%, 
              black ${(i + 1) * (100 / blurLayers)}%
            )`,
          }}
        />
      ))}
    </div>
  );
}

import React from "react";
import { cn } from "../../lib/utils";

interface GlassCardProps extends React.ComponentPropsWithoutRef<"div"> {
  gradient?: boolean;
}

export function GlassCard({ children, className, gradient = false, ...props }: any) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl transition-all duration-300",
        gradient && "bg-gradient-to-br from-white/20 to-white/5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

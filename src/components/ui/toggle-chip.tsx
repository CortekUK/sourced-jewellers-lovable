import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleChipProps {
  children: React.ReactNode;
  selected: boolean;
  onToggle: () => void;
  className?: string;
}

export const ToggleChip = React.forwardRef<HTMLButtonElement, ToggleChipProps>(
  ({ children, selected, onToggle, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onToggle}
        className={cn(
          "inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200",
          "hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          selected
            ? "bg-primary/10 border-primary text-primary shadow-gold"
            : "border-border bg-background text-muted-foreground hover:bg-muted/50",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ToggleChip.displayName = "ToggleChip";
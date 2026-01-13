import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface FlyoutSubmenuProps {
  title: string;
  icon: LucideIcon;
  subItems: SubItem[];
  isActive: (url: string) => boolean;
}

export function FlyoutSubmenu({ title, icon: Icon, subItems, isActive }: FlyoutSubmenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Check if any child route is active
  const hasActiveChild = subItems.some(item => isActive(item.url));

  const getSubNavClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex w-full items-center gap-2.5 h-10 px-3 rounded-lg transition-all duration-[160ms] outline-none border-0",
      isActive
        ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))] font-medium"
        : "bg-transparent text-sidebar-foreground hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
    );

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Trigger icon */}
      <button
        className={cn(
          "relative flex items-center justify-center w-11 h-11 rounded-lg transition-all duration-[160ms] outline-none border-0",
          hasActiveChild
            ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
            : "bg-transparent text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]",
          "focus-visible:shadow-[0_0_0_2px_hsl(var(--sidebar-ring))]"
        )}
        aria-label={title}
      >
        {hasActiveChild && (
          <span className="absolute left-0 top-[8px] bottom-[8px] w-[3px] bg-[hsl(var(--sidebar-primary))] rounded-r-[3px]" />
        )}
        <Icon className="h-[18px] w-[18px]" />
      </button>

      {/* Flyout panel */}
      {isOpen && (
        <div className="absolute left-16 top-0 z-50 min-w-[220px] animate-in fade-in-0 slide-in-from-left-1 duration-200">
          <div className="bg-popover border border-[hsl(var(--sidebar-border))] rounded-xl shadow-[0_10px_24px_rgba(0,0,0,0.26)] p-2">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {title}
            </div>
            <div className="space-y-1">
              {subItems.map((subItem) => (
                <NavLink
                  key={subItem.url}
                  to={subItem.url}
                  className={getSubNavClass}
                >
                  <subItem.icon className="h-4 w-4" />
                  <span className="text-sm">{subItem.title}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

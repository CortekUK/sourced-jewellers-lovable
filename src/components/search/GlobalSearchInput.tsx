import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Command, Clock, Package, Hash, Building2, Receipt } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useOmniSearch, SearchResult } from '@/hooks/useOmniSearch';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface GlobalSearchInputProps {
  onOpenCommandPalette: () => void;
  className?: string;
}

const getResultIcon = (kind: string) => {
  switch (kind) {
    case 'product': return Package;
    case 'serial': return Hash;
    case 'supplier': return Building2;
    case 'sale': return Receipt;
    default: return Search;
  }
};

const getKindLabel = (kind: string) => {
  switch (kind) {
    case 'product': return 'Products';
    case 'serial': return 'Serial Numbers';
    case 'supplier': return 'Suppliers';
    case 'sale': return 'Sales';
    default: return 'Results';
  }
};

const highlightMatches = (text: string, query: string) => {
  if (!query.trim()) return text;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-[hsl(var(--sidebar-primary))]/20 text-[hsl(var(--sidebar-primary))] font-semibold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export const GlobalSearchInput: React.FC<GlobalSearchInputProps> = ({ 
  onOpenCommandPalette, 
  className 
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [showRecents, setShowRecents] = useState(false);
  const { search, results, loading, recentSearches, clearResults, queryTime } = useOmniSearch();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Group results by kind
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {
      product: [],
      serial: [],
      supplier: [],
      sale: []
    };
    
    results.forEach(r => {
      if (groups[r.kind]) {
        groups[r.kind].push(r);
      }
    });
    
    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [results]);

  // Flatten grouped results for keyboard navigation
  const flatResults = useMemo(() => results, [results]);

  // Restore focus after results load
  useEffect(() => {
    if (!loading && isOpen && inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading, isOpen]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  // Handle search
  useEffect(() => {
    if (query.trim()) {
      search(query);
      setIsOpen(true);
      setShowRecents(false);
    } else {
      clearResults();
      setShowRecents(false);
    }
  }, [query, search, clearResults]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    setQuery('');
    setIsOpen(false);
    setShowRecents(false);
    inputRef.current?.blur();
  };

  const handleRecentSearch = (recentQuery: string) => {
    setQuery(recentQuery);
    setShowRecents(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showRecents && recentSearches.length > 0) {
      // Handle recent searches navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, recentSearches.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        handleRecentSearch(recentSearches[activeIndex]);
      } else if (e.key === 'Escape') {
        setShowRecents(false);
        setQuery('');
        inputRef.current?.blur();
      }
    } else if (flatResults.length > 0) {
      // Handle search results navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, flatResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && flatResults[activeIndex]) {
          handleSelect(flatResults[activeIndex]);
        } else if (flatResults.length > 0) {
          handleSelect(flatResults[0]);
        }
      } else if (e.key === 'Escape') {
        setQuery('');
        setIsOpen(false);
        inputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      setQuery('');
      setIsOpen(false);
      setShowRecents(false);
      inputRef.current?.blur();
    }
    
    // Tab doesn't close overlay
    if (e.key === 'Tab') {
      // Natural focus movement
    }
  };

  const handleFocus = () => {
    if (!query.trim() && recentSearches.length > 0) {
      setShowRecents(true);
      setIsOpen(true);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Only close if focus is leaving the component entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setTimeout(() => {
        setShowRecents(false);
        if (!query.trim()) {
          setIsOpen(false);
        }
      }, 200);
    }
  };

  const renderContent = () => (
    <div className="max-h-[70vh] overflow-auto">
      {loading && (
        <div className="p-4">
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground" role="status" aria-live="polite" aria-atomic="true">
            <Search className="mr-2 h-4 w-4 animate-spin" />
            Searching...
          </div>
          {/* Skeleton loaders */}
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
                <div className="h-4 w-4 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!loading && showRecents && recentSearches.length > 0 && (
        <div className="p-2" role="listbox" id="search-recents-listbox">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Recent Searches
          </div>
          {recentSearches.slice(0, 5).map((recent, index) => (
            <button
              key={recent}
              role="option"
              id={`search-recent-${index}`}
              aria-selected={index === activeIndex}
              onClick={() => handleRecentSearch(recent)}
              onMouseDown={(e) => e.preventDefault()}
              className={cn(
                "w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-all duration-200",
                index === activeIndex
                  ? "bg-[hsl(var(--sidebar-accent))] border-l-2 border-[hsl(var(--sidebar-primary))]"
                  : "hover:bg-accent"
              )}
            >
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{recent}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {!loading && !showRecents && flatResults.length === 0 && query.trim() && (
        <div className="p-8 text-center" role="status" aria-live="polite" aria-atomic="true">
          <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm font-medium text-foreground mb-1">
            No results for "{query}"
          </p>
          <p className="text-xs text-muted-foreground">
            Try different keywords or use filters like <code className="px-1 py-0.5 bg-muted rounded text-[hsl(var(--sidebar-primary))]">sku:ABC123</code>
          </p>
        </div>
      )}
      
      {!loading && !showRecents && groupedResults.length > 0 && (
        <div className="p-1" role="listbox" id="search-results-listbox">
          {groupedResults.map(([kind, items]) => (
            <div key={kind} className="mb-1">
              <div className="sticky top-0 bg-popover px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide z-10">
                {getKindLabel(kind)}
              </div>
              {items.map((result) => {
                const Icon = getResultIcon(result.kind);
                const globalIndex = flatResults.findIndex(r => r.id === result.id && r.kind === result.kind);
                const isActive = globalIndex === activeIndex;
                
                return (
                  <button
                    key={`${result.kind}-${result.id}`}
                    role="option"
                    id={`search-result-${globalIndex}`}
                    aria-selected={isActive}
                    onClick={() => handleSelect(result)}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActiveIndex(globalIndex)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-all duration-200",
                      isActive
                        ? "bg-[hsl(var(--sidebar-accent))] border-l-2 border-[hsl(var(--sidebar-primary))]"
                        : "hover:bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">
                        {highlightMatches(result.title, query)}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {result.subtitle}
                      </div>
                    </div>
                    {result.score === 1.0 && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">Exact</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          
          {flatResults.length > 0 && (
            <div className="border-t mt-2 pt-2 px-3 pb-2 text-xs text-muted-foreground text-center">
              {flatResults.length} result{flatResults.length !== 1 ? 's' : ''} • {queryTime}ms
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={cn("relative max-w-sm", className)} onBlur={handleBlur}>
      {isMobile ? (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="search"
              placeholder="Quick search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onClick={() => setIsOpen(true)}
              role="combobox"
              aria-expanded={isOpen}
              aria-controls={showRecents ? "search-recents-listbox" : "search-results-listbox"}
              aria-autocomplete="list"
              aria-activedescendant={activeIndex >= 0 ? (showRecents ? `search-recent-${activeIndex}` : `search-result-${activeIndex}`) : undefined}
              className="pl-9 pr-12 focus-visible:ring-2 focus-visible:ring-[hsl(var(--sidebar-primary))] focus-visible:ring-offset-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenCommandPalette}
              className="absolute right-1 top-1/2 h-7 w-8 -translate-y-1/2 p-0 text-muted-foreground hover:text-foreground"
              title="Open command palette (Ctrl+K)"
            >
              <Command className="h-3 w-3" />
            </Button>
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen} modal={false}>
            <SheetContent side="top" className="h-[90vh]">
              <SheetHeader>
                <SheetTitle>Search</SheetTitle>
              </SheetHeader>
              {renderContent()}
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <Popover open={isOpen && (flatResults.length > 0 || loading || showRecents)} onOpenChange={setIsOpen} modal={false}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="search"
                placeholder="Quick search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={showRecents ? "search-recents-listbox" : "search-results-listbox"}
                aria-autocomplete="list"
                aria-activedescendant={activeIndex >= 0 ? (showRecents ? `search-recent-${activeIndex}` : `search-result-${activeIndex}`) : undefined}
                className="pl-9 pr-12 focus-visible:ring-2 focus-visible:ring-[hsl(var(--sidebar-primary))] focus-visible:ring-offset-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenCommandPalette}
                className="absolute right-1 top-1/2 h-7 w-8 -translate-y-1/2 p-0 text-muted-foreground hover:text-foreground"
                title="Open command palette (Ctrl+K)"
              >
                <Command className="h-3 w-3" />
              </Button>
            </div>
          </PopoverTrigger>
          
          <PopoverContent 
            className="w-96 p-0 rounded-xl border-[hsl(var(--sidebar-border))] shadow-lg" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {renderContent()}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

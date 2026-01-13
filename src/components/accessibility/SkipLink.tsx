import { Button } from '@/components/ui/button';

export function SkipLink() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="absolute -top-10 left-4 z-50 focus:top-4 transition-all duration-200 sr-only focus:not-sr-only"
      onClick={() => {
        const main = document.querySelector('main');
        main?.focus();
      }}
    >
      Skip to main content
    </Button>
  );
}
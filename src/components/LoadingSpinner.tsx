'use client';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'md' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const containerSizeClasses = {
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerSizeClasses[size]}`}>
      <div className="relative">
        <div
          className={`animate-spin rounded-full border-4 border-border/50 border-t-primary ${sizeClasses[size]}`}
        />
        <div
          className={`absolute inset-0 animate-ping rounded-full bg-primary/20 ${sizeClasses[size]}`}
        />
      </div>
      
      {message && (
        <p className="mt-4 text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}

export function RecipeLoadingState() {
  const steps = [
    'Fetching recipe page...',
    'Analyzing structured data...',
    'Parsing ingredients...',
    'Processing instructions...',
    'Almost ready!'
  ];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl border border-border/60 bg-background/80 p-8 shadow-sm">
        <div className="mb-6 text-center">
          <LoadingSpinner size="lg" />
        </div>
        
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="flex size-6 items-center justify-center rounded-full bg-primary/10">
                  <div className="size-2 rounded-full bg-primary" />
                </div>
              </div>
              <span className="text-sm text-muted-foreground">{step}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            This usually takes 2-5 seconds
          </p>
        </div>
      </div>
    </div>
  );
}

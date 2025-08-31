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
        {/* Main spinner */}
        <div className={`animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 
                       border-t-blue-600 ${sizeClasses[size]}`}></div>
        
        {/* Inner pulse */}
        <div className={`absolute inset-0 animate-pulse rounded-full bg-blue-100 dark:bg-blue-900/20 
                       opacity-75 ${sizeClasses[size]}`}></div>
      </div>
      
      {message && (
        <p className="mt-4 text-gray-600 dark:text-gray-400 text-center animate-pulse">
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
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <LoadingSpinner size="lg" />
        </div>
        
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 
                             flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                </div>
              </div>
              <span className="text-gray-600 dark:text-gray-400">{step}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This usually takes 2-5 seconds
          </p>
        </div>
      </div>
    </div>
  );
}

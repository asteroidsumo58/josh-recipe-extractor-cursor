'use client';

import { ParseError } from '@/app/api/parse/route';

interface ErrorDisplayProps {
  error: ParseError;
  onRetry: () => void;
  onReset: () => void;
}

export default function ErrorDisplay({ error, onRetry, onReset }: ErrorDisplayProps) {
  const getErrorIcon = () => {
    switch (error.error) {
      case 'fetch_failed':
        return '🌐';
      case 'no_recipe_found':
        return '🔍';
      case 'forbidden_url':
        return '🚫';
      case 'invalid_url':
        return '⚠️';
      default:
        return '❌';
    }
  };

  const getErrorTitle = () => {
    switch (error.error) {
      case 'fetch_failed':
        return 'Connection Failed';
      case 'no_recipe_found':
        return 'No Recipe Found';
      case 'forbidden_url':
        return 'URL Not Allowed';
      case 'invalid_url':
        return 'Invalid URL';
      case 'rate_limit_exceeded':
        return 'Too Many Requests';
      case 'missing_url':
        return 'URL Required';
      default:
        return 'Something Went Wrong';
    }
  };

  const getDetailedSuggestion = () => {
    switch (error.error) {
      case 'fetch_failed':
        return {
          title: 'Connection Issues',
          suggestions: [
            'Check your internet connection',
            'The website might be temporarily down',
            'Try again in a few moments',
            'Some sites block automated requests - try copying the URL from a different browser'
          ]
        };
      case 'no_recipe_found':
        return {
          title: 'Recipe Detection Failed',
          suggestions: [
            'Make sure the URL points directly to a recipe page',
            'The page might not contain structured recipe data',
            'Try a different recipe from the same website',
            'Use the manual recipe entry option below'
          ]
        };
      case 'forbidden_url':
        return {
          title: 'URL Security Check',
          suggestions: [
            'Only public recipe websites are supported',
            'Local files and private networks are blocked for security',
            'Make sure the URL starts with http:// or https://',
            'Try a recipe from a popular cooking website'
          ]
        };
      case 'invalid_url':
        return {
          title: 'URL Format Issue',
          suggestions: [
            'Make sure the URL is complete (including http:// or https://)',
            'Check for typos in the URL',
            'Copy and paste the URL directly from your browser',
            'Try one of the example URLs provided'
          ]
        };
      case 'rate_limit_exceeded':
        return {
          title: 'Rate Limit Reached',
          suggestions: [
            'Please wait a minute before trying again',
            'You can try up to 10 recipes per minute',
            'This helps keep the service fast for everyone',
            'The limit resets automatically'
          ]
        };
      default:
        return {
          title: 'Unexpected Error',
          suggestions: [
            'Try refreshing the page',
            'Check your internet connection',
            'Try a different recipe URL',
            'The issue might be temporary'
          ]
        };
    }
  };

  const canRetry = error.error === 'fetch_failed' || error.error === 'rate_limit_exceeded';
  const detailedSuggestion = getDetailedSuggestion();

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-start">
          <div className="text-4xl mr-4" role="img" aria-label="Error icon">
            {getErrorIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
              {getErrorTitle()}
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {error.message}
            </p>
            
            {/* Detailed suggestions */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                {detailedSuggestion.title}
              </h4>
              <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                {detailedSuggestion.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {canRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 
                           focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                           transition-colors duration-200"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={onReset}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 
                         focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                         transition-colors duration-200"
              >
                Try Different URL
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Manual recipe input fallback */}
      {error.error === 'no_recipe_found' && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Manual Recipe Entry (Coming Soon)
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            Can't find structured recipe data? Manual recipe parsing will be available in a future update.
            For now, try these alternatives:
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 mb-3">
            <li>• Look for a "Print Recipe" or "Recipe Card" button on the page</li>
            <li>• Try a different recipe from the same website</li>
            <li>• Search for the recipe on AllRecipes or Food Network</li>
            <li>• Check if the page has a mobile version with cleaner formatting</li>
          </ul>
          <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded border border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-600 dark:text-blue-300">
              💡 <strong>Pro tip:</strong> This app works best with recipe websites that use structured data 
              (JSON-LD, Microdata, or RDFa). Most major cooking sites and food blogs support this format.
            </p>
          </div>
        </div>
      )}

      {/* Troubleshooting guide */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          Troubleshooting Guide
        </h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Website Issues</h5>
            <ul className="space-y-1">
              <li>• Some sites block automated requests</li>
              <li>• Recipe must be publicly accessible</li>
              <li>• URL should point to a recipe page</li>
              <li>• Avoid recipe lists or homepages</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Best Practices</h5>
            <ul className="space-y-1">
              <li>• Copy URLs directly from browser</li>
              <li>• Try "Print Recipe" versions</li>
              <li>• Use major cooking websites</li>
              <li>• Check mobile versions of pages</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
          <p className="text-xs text-green-700 dark:text-green-300">
            <strong>✅ Works great with:</strong> AllRecipes, Food Network, Serious Eats, Bon Appétit, 
            Tasty, BBC Good Food, and most food blogs with structured recipe data.
          </p>
        </div>
      </div>
    </div>
  );
}

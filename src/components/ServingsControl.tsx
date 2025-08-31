'use client';

import { useState } from 'react';
import { getSuggestedServings } from '@/hooks/useRecipeScaling';

interface ServingsControlProps {
  originalServings: number;
  currentServings: number;
  scalingMultiplier: number;
  onServingsChange: (servings: number) => void;
  onReset: () => void;
  canScaleDown: boolean;
  canScaleUp: boolean;
  className?: string;
}

export default function ServingsControl({
  originalServings,
  currentServings,
  scalingMultiplier,
  onServingsChange,
  onReset,
  canScaleDown,
  canScaleUp,
  className = ''
}: ServingsControlProps) {
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const suggestedServings = getSuggestedServings(originalServings);

  const handleCustomSubmit = () => {
    const customServings = parseInt(customInput);
    if (customServings > 0 && customServings <= 50) {
      onServingsChange(customServings);
      setCustomInput('');
      setShowCustomInput(false);
    }
  };

  const handleIncrement = () => {
    if (canScaleUp) {
      onServingsChange(currentServings + 1);
    }
  };

  const handleDecrement = () => {
    if (canScaleDown) {
      onServingsChange(currentServings - 1);
    }
  };

  const getScaleDescription = () => {
    if (scalingMultiplier === 1) return 'Original recipe';
    if (scalingMultiplier === 0.5) return 'Half recipe';
    if (scalingMultiplier === 2) return 'Double recipe';
    if (scalingMultiplier < 1) return `${Math.round(scalingMultiplier * 100)}% of original`;
    return `${scalingMultiplier.toFixed(1)}× original`;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Servings
        </h3>
        {scalingMultiplier !== 1 && (
          <button
            onClick={onReset}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 
                     transition-colors duration-200"
          >
            Reset to original
          </button>
        )}
      </div>

      {/* Current Servings Display */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleDecrement}
            disabled={!canScaleDown}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold
              transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${canScaleDown 
                ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 focus:ring-gray-500' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
          >
            −
          </button>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {currentServings}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentServings === 1 ? 'serving' : 'servings'}
            </div>
          </div>
          
          <button
            onClick={handleIncrement}
            disabled={!canScaleUp}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold
              transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${canScaleUp 
                ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 focus:ring-gray-500' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
          >
            +
          </button>
        </div>
        
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {getScaleDescription()}
        </div>
      </div>

      {/* Quick Scale Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {suggestedServings.map((servings) => (
          <button
            key={servings}
            onClick={() => onServingsChange(servings)}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              ${currentServings === servings
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
          >
            {servings}
          </button>
        ))}
      </div>

      {/* Custom Input */}
      {showCustomInput ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="50"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
              placeholder="Enter servings"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <button
              onClick={handleCustomSubmit}
              disabled={!customInput || parseInt(customInput) <= 0 || parseInt(customInput) > 50}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                       disabled:bg-gray-400 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       transition-colors duration-200"
            >
              Set
            </button>
          </div>
          <button
            onClick={() => {
              setShowCustomInput(false);
              setCustomInput('');
            }}
            className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowCustomInput(true)}
          className="w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 
                   border border-blue-200 dark:border-blue-600 rounded-lg
                   hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Custom amount
        </button>
      )}

      {/* Scaling Info */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Original:</span>
            <span>{originalServings} servings</span>
          </div>
          <div className="flex justify-between">
            <span>Current:</span>
            <span>{currentServings} servings</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Scale factor:</span>
            <span>{scalingMultiplier.toFixed(2)}×</span>
          </div>
        </div>
      </div>

      {/* Scaling Tips */}
      {scalingMultiplier !== 1 && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-xs text-blue-800 dark:text-blue-200">
            <div className="font-medium mb-1">💡 Scaling Tips:</div>
            <ul className="space-y-1">
              <li>• Ingredient quantities are automatically adjusted</li>
              <li>• Cooking times may need adjustment for large changes</li>
              <li>• Baking recipes are more sensitive to scaling</li>
              {scalingMultiplier > 2 && (
                <li>• Large increases may require bigger cookware</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

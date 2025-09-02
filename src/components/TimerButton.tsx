'use client';

import { useMemo, useState } from 'react';
import { Duration } from '@/types/recipe';
import { useTimerContext } from '@/contexts/TimerContext';
import { formatTime } from '@/hooks/useTimer';

interface TimerButtonProps {
  duration: Duration;
  stepNumber: number;
  className?: string;
}

export default function TimerButton({ duration, stepNumber, className = '' }: TimerButtonProps) {
  const { createTimer, startTimer, pauseTimer, resetTimer, deleteTimer, timers } = useTimerContext();
  const [isCreating, setIsCreating] = useState(false);

  // Check if there's already a timer for this step
  const existingTimer = useMemo(() => (
    timers.find(timer => 
      timer.label.includes(`Step ${stepNumber}`) && 
      timer.totalSeconds === duration.minutes * 60
    )
  ), [timers, stepNumber, duration.minutes]);

  const handleStartTimer = () => {
    if (existingTimer) {
      startTimer(existingTimer.id);
    } else {
      setIsCreating(true);
      const label = `Step ${stepNumber} - ${duration.display}`;
      const timerId = createTimer(label, duration.minutes);
      startTimer(timerId);
      setIsCreating(false);
    }
  };

  const getButtonState = () => {
    if (existingTimer) {
      if (existingTimer.isCompleted) {
        return { text: '✅ Complete', color: 'bg-green-600 hover:bg-green-700', disabled: false };
      } else if (existingTimer.isRunning) {
        return { 
          text: `⏱️ ${formatTime(existingTimer.remainingSeconds)}`, 
          color: 'bg-orange-600 hover:bg-orange-700 animate-pulse', 
          disabled: false 
        };
      } else {
        return { text: '▶️ Resume', color: 'bg-blue-600 hover:bg-blue-700', disabled: false };
      }
    }
    
    if (isCreating) {
      return { text: 'Starting...', color: 'bg-gray-400', disabled: true };
    }
    
    return { text: `⏲️ Start ${duration.display}`, color: 'bg-orange-600 hover:bg-orange-700', disabled: false };
  };

  const { text, color, disabled } = getButtonState();

  const getAriaLabel = () => {
    if (existingTimer) {
      if (existingTimer.isCompleted) {
        return `Timer for step ${stepNumber} completed`;
      } else if (existingTimer.isRunning) {
        return `Timer for step ${stepNumber} is running, ${formatTime(existingTimer.remainingSeconds)} remaining. Click to view timer.`;
      } else {
        return `Resume timer for step ${stepNumber}`;
      }
    }
    return `Start ${duration.display} timer for step ${stepNumber}`;
  };

  // If a timer exists for this step, render an inline circular display with controls
  if (existingTimer) {
    const circumference = 2 * Math.PI * 36; // r=36 for ~80px circle
    const progress = 1 - Math.max(0, Math.min(1, existingTimer.remainingSeconds / existingTimer.totalSeconds));
    const dash = circumference * progress;
    const gap = circumference - dash;

    return (
      <div className={`w-full max-w-full mt-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${className}`}>
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative" style={{ width: 96, height: 96 }}>
            <svg viewBox="0 0 100 100" className="w-full h-full rotate-[-90deg]">
              <circle cx="50" cy="50" r="36" className="stroke-gray-300 dark:stroke-gray-700" strokeWidth="8" fill="none" />
              <circle
                cx="50"
                cy="50"
                r="36"
                strokeWidth="8"
                fill="none"
                className={existingTimer.isRunning ? 'stroke-orange-500' : 'stroke-blue-500'}
                strokeDasharray={`${dash} ${gap}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-mono font-semibold text-gray-900 dark:text-white">
                {formatTime(existingTimer.remainingSeconds)}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">Step {stepNumber} • {duration.display}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {existingTimer.isRunning ? (
                <button
                  onClick={() => pauseTimer(existingTimer.id)}
                  className="px-3 py-1 rounded-full bg-orange-600 text-white hover:bg-orange-700 text-sm"
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={() => startTimer(existingTimer.id)}
                  className="px-3 py-1 rounded-full bg-green-600 text-white hover:bg-green-700 text-sm"
                >
                  Start
                </button>
              )}
              <button
                onClick={() => resetTimer(existingTimer.id)}
                className="px-3 py-1 rounded-full bg-gray-700 text-white hover:bg-gray-600 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteTimer(existingTimer.id)}
                className="px-3 py-1 rounded-full bg-gray-500 text-white hover:bg-gray-600 text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: render the start button
  return (
    <button
      onClick={handleStartTimer}
      disabled={disabled}
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
        ${color} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      aria-label={getAriaLabel()}
      title={`Start ${duration.display} timer`}
    >
      {text}
    </button>
  );
}

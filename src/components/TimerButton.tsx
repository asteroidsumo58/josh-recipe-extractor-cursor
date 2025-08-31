'use client';

import { useState } from 'react';
import { Duration } from '@/types/recipe';
import { useTimerContext } from '@/contexts/TimerContext';
import { formatTime } from '@/hooks/useTimer';

interface TimerButtonProps {
  duration: Duration;
  stepNumber: number;
  className?: string;
}

export default function TimerButton({ duration, stepNumber, className = '' }: TimerButtonProps) {
  const { createTimer, startTimer, timers } = useTimerContext();
  const [isCreating, setIsCreating] = useState(false);

  // Check if there's already a timer for this step
  const existingTimer = timers.find(timer => 
    timer.label.includes(`Step ${stepNumber}`) && 
    timer.totalSeconds === duration.minutes * 60
  );

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
      title={existingTimer?.isRunning ? 'Timer is running' : `Start ${duration.display} timer`}
    >
      {text}
    </button>
  );
}

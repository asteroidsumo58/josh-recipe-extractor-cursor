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
  const [showCustom, setShowCustom] = useState(false);

  // Pre-fill custom H/M/S from parsed duration
  const defaultHours = Math.floor((duration.minutes || 0) / 60);
  const defaultMinutes = Math.floor((duration.minutes || 0) % 60);
  const [customH, setCustomH] = useState<number>(defaultHours);
  const [customM, setCustomM] = useState<number>(defaultMinutes);
  const [customS, setCustomS] = useState<number>(0);

  // Prefer a running timer for this step; otherwise pick any timer for this step
  const existingTimer = useMemo(() => {
    const stepTimers = timers.filter(t => t.label.includes(`Step ${stepNumber}`));
    const running = stepTimers.find(t => t.isRunning);
    return running || stepTimers[0];
  }, [timers, stepNumber]);

  const handleStartTimer = () => {
    if (existingTimer && existingTimer.totalSeconds === duration.minutes * 60) {
      startTimer(existingTimer.id);
      return;
    }
    setIsCreating(true);
    const label = `Step ${stepNumber} - ${duration.display}`;
    const timerId = createTimer(label, duration.minutes);
    startTimer(timerId);
    setIsCreating(false);
  };

  const totalCustomSeconds = Math.max(1, Math.floor(customH) * 3600 + Math.floor(customM) * 60 + Math.floor(customS));
  const totalCustomMinutes = totalCustomSeconds / 60;

  const handleCreateCustom = () => {
    setIsCreating(true);
    const label = `Step ${stepNumber} - Custom ${formatTime(totalCustomSeconds)}`;
    const timerId = createTimer(label, totalCustomMinutes);
    startTimer(timerId);
    setIsCreating(false);
    setShowCustom(false);
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
    const headerMinutes = Math.round(existingTimer.totalSeconds / 60);

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
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">Step {stepNumber} • {headerMinutes}m</div>
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

  // Default: render the start + custom buttons
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleStartTimer}
        disabled={disabled}
        className={`
          inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
          ${color} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={getAriaLabel()}
        title={`Start ${duration.display} timer`}
      >
        {text}
      </button>

      <div className="relative">
        <button
          onClick={() => setShowCustom(v => !v)}
          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label={`Create custom timer for step ${stepNumber}`}
          title="Custom timer"
        >
          Custom…
        </button>

        {showCustom && (
          <div className="absolute z-10 mt-2 w-72 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Custom timer</div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Hours</label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  step={1}
                  value={customH}
                  onChange={e => setCustomH(Math.max(0, Math.min(99, Number(e.target.value))))}
                  className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Minutes</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  step={1}
                  value={customM}
                  onChange={e => setCustomM(Math.max(0, Math.min(59, Number(e.target.value))))}
                  className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Seconds</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  step={1}
                  value={customS}
                  onChange={e => setCustomS(Math.max(0, Math.min(59, Number(e.target.value))))}
                  className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">Preview: <span className="font-mono text-gray-900 dark:text-gray-100">{formatTime(totalCustomSeconds)}</span></div>
            <div className="mt-3 flex items-center gap-2 justify-end">
              <button onClick={() => setShowCustom(false)} className="px-3 py-1 rounded bg-gray-500 text-white hover:bg-gray-600 text-sm">Close</button>
              <button onClick={handleCreateCustom} className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-sm">Create & Start</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

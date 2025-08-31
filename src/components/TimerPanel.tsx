'use client';

import { useState } from 'react';
import { useTimerContext } from '@/contexts/TimerContext';
import { formatTime, parseTimeInput, Timer } from '@/hooks/useTimer';

interface TimerPanelProps {
  className?: string;
}

export default function TimerPanel({ className = '' }: TimerPanelProps) {
  const { timers, createTimer, startTimer, pauseTimer, resetTimer, deleteTimer, updateTimerLabel } = useTimerContext();
  const [newTimerInput, setNewTimerInput] = useState('');
  const [newTimerLabel, setNewTimerLabel] = useState('');
  const [editingTimer, setEditingTimer] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const handleCreateTimer = () => {
    const minutes = parseTimeInput(newTimerInput);
    if (minutes <= 0) return;

    const label = newTimerLabel.trim() || `Timer ${minutes}m`;
    createTimer(label, minutes);
    setNewTimerInput('');
    setNewTimerLabel('');
  };

  const handleEditLabel = (timer: Timer) => {
    setEditingTimer(timer.id);
    setEditLabel(timer.label);
  };

  const handleSaveLabel = () => {
    if (editingTimer && editLabel.trim()) {
      updateTimerLabel(editingTimer, editLabel.trim());
    }
    setEditingTimer(null);
    setEditLabel('');
  };

  const handleCancelEdit = () => {
    setEditingTimer(null);
    setEditLabel('');
  };

  const getTimerProgress = (timer: Timer) => {
    return ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100;
  };

  const activeTimers = timers.filter(timer => !timer.isCompleted);
  const completedTimers = timers.filter(timer => timer.isCompleted);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Kitchen Timers
      </h3>

      {/* Create New Timer */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Add Custom Timer
        </h4>
        <div className="space-y-3">
          <div>
            <input
              type="text"
              placeholder="Timer name (optional)"
              value={newTimerLabel}
              onChange={(e) => setNewTimerLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="5m, 1h 30m, 2:30, etc."
              value={newTimerInput}
              onChange={(e) => setNewTimerInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTimer()}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleCreateTimer}
              disabled={!newTimerInput.trim() || parseTimeInput(newTimerInput) <= 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                       disabled:bg-gray-400 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       transition-colors duration-200"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Examples: "5" (5 min), "1h 30m", "2:30", "90s"
          </p>
        </div>
      </div>

      {/* Active Timers */}
      {activeTimers.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Active Timers ({activeTimers.length})
          </h4>
          <div className="space-y-3">
            {activeTimers.map((timer) => (
              <div
                key={timer.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  timer.isRunning
                    ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  {editingTimer === timer.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveLabel();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveLabel}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditLabel(timer)}
                      className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-gray-100 
                               hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {timer.label}
                    </button>
                  )}
                  <button
                    onClick={() => deleteTimer(timer.id)}
                    className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete timer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>{formatTime(timer.remainingSeconds)} remaining</span>
                    <span>{formatTime(timer.totalSeconds)} total</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        timer.isRunning ? 'bg-orange-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${getTimerProgress(timer)}%` }}
                    />
                  </div>
                </div>

                {/* Timer Display */}
                <div className="flex items-center justify-between">
                  <div className={`text-2xl font-mono font-bold ${
                    timer.isRunning ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {formatTime(timer.remainingSeconds)}
                  </div>
                  
                  <div className="flex gap-2">
                    {timer.isRunning ? (
                      <button
                        onClick={() => pauseTimer(timer.id)}
                        className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700
                                 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                                 transition-colors duration-200"
                      >
                        ⏸️ Pause
                      </button>
                    ) : (
                      <button
                        onClick={() => startTimer(timer.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700
                                 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                                 transition-colors duration-200"
                      >
                        ▶️ Start
                      </button>
                    )}
                    <button
                      onClick={() => resetTimer(timer.id)}
                      className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700
                               focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                               transition-colors duration-200"
                    >
                      🔄 Reset
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Timers */}
      {completedTimers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Completed ({completedTimers.length})
          </h4>
          <div className="space-y-2">
            {completedTimers.map((timer) => (
              <div
                key={timer.id}
                className="p-3 rounded-lg border-2 border-green-300 bg-green-50 dark:bg-green-900/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400">✅</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {timer.label}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => resetTimer(timer.id)}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Restart
                    </button>
                    <button
                      onClick={() => deleteTimer(timer.id)}
                      className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {timers.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">⏲️</div>
          <p>No timers yet. Create one above or use the timer buttons in recipe steps!</p>
        </div>
      )}
    </div>
  );
}

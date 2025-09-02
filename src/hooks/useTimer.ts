'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface Timer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isCompleted: boolean;
  startTime?: number;
}

export interface UseTimerReturn {
  timers: Timer[];
  createTimer: (label: string, minutes: number) => string;
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  deleteTimer: (id: string) => void;
  updateTimerLabel: (id: string, label: string) => void;
  primaryTimerId: string | null;
  setPrimaryTimer: (id: string | null) => void;
}

export function useTimer(): UseTimerReturn {
  const [timers, setTimers] = useState<Timer[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<{ play: () => void } | null>(null);
  const [primaryTimerId, setPrimaryTimerId] = useState<string | null>(null);

  // Initialize audio for timer completion
  useEffect(() => {
    // Create a pulsing beep sound (~10 seconds) using Web Audio API
    const createBeepSound = () => {
      type WebkitAudioContext = {
        webkitAudioContext: typeof AudioContext;
      };
      const AudioContextConstructor =
        (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
        (window as unknown as WebkitAudioContext).webkitAudioContext;
      if (!AudioContextConstructor) return;

      const audioContext = new AudioContextConstructor();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 tone
      oscillator.type = 'sine';

      const now = audioContext.currentTime;
      const total = 10; // seconds of alert

      // Schedule a series of short pulses for audibility over ~10s
      // Each second: 0.4s on, 0.6s off
      gainNode.gain.setValueAtTime(0, now);
      for (let t = 0; t < total; t++) {
        const start = now + t;
        const onA = start + 0.01; // fade in quickly
        const onB = start + 0.4;  // stay on
        const off = start + 0.5;  // fade out
        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(0.35, onA);
        gainNode.gain.linearRampToValueAtTime(0.35, onB);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, off);
      }

      oscillator.start(now);
      oscillator.stop(now + total + 0.6);
    };

    audioRef.current = { play: createBeepSound };
  }, []);

  // Timer update loop
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimers(prevTimers => {
        const updatedTimers = prevTimers.map(timer => {
          if (!timer.isRunning || timer.isCompleted) return timer;

          const now = Date.now();
          const elapsed = Math.floor((now - (timer.startTime || now)) / 1000);
          const remaining = Math.max(0, timer.totalSeconds - elapsed);

          if (remaining === 0 && !timer.isCompleted) {
            // Timer completed - play sound and show notification
            if (audioRef.current) {
              try {
                audioRef.current.play();
              } catch (error) {
                console.log('Could not play timer sound:', error);
              }
            }

            // Show browser notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Timer Complete!', {
                body: `${timer.label} - Time's up!`,
                icon: '/favicon.ico',
              });
            }

            return {
              ...timer,
              remainingSeconds: 0,
              isRunning: false,
              isCompleted: true,
            };
          }

          return {
            ...timer,
            remainingSeconds: remaining,
          };
        });

        return updatedTimers;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Request notification permission on first use
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const createTimer = useCallback((label: string, minutes: number): string => {
    const id = `timer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const totalSeconds = Math.round(minutes * 60);

    const newTimer: Timer = {
      id,
      label,
      totalSeconds,
      remainingSeconds: totalSeconds,
      isRunning: false,
      isCompleted: false,
    };

    setTimers(prev => [...prev, newTimer]);
    return id;
  }, []);

  const startTimer = useCallback((id: string) => {
    setTimers(prev => prev.map(timer => {
      if (timer.id === id) {
        return {
          ...timer,
          isRunning: true,
          isCompleted: false,
          startTime: Date.now() - (timer.totalSeconds - timer.remainingSeconds) * 1000,
        };
      }
      return timer;
    }));
    // If no primary is set, default to the started timer
    setPrimaryTimerId(prev => prev ?? id);
  }, []);

  const pauseTimer = useCallback((id: string) => {
    setTimers(prev => prev.map(timer => {
      if (timer.id === id) {
        return {
          ...timer,
          isRunning: false,
        };
      }
      return timer;
    }));
  }, []);

  const resetTimer = useCallback((id: string) => {
    setTimers(prev => prev.map(timer => {
      if (timer.id === id) {
        return {
          ...timer,
          remainingSeconds: timer.totalSeconds,
          isRunning: false,
          isCompleted: false,
          startTime: undefined,
        };
      }
      return timer;
    }));
  }, []);

  const deleteTimer = useCallback((id: string) => {
    setTimers(prev => prev.filter(timer => timer.id !== id));
  }, []);

  const updateTimerLabel = useCallback((id: string, label: string) => {
    setTimers(prev => prev.map(timer => {
      if (timer.id === id) {
        return { ...timer, label };
      }
      return timer;
    }));
  }, []);

  return {
    timers,
    createTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    deleteTimer,
    updateTimerLabel,
    primaryTimerId,
    setPrimaryTimer: setPrimaryTimerId,
  };
}

// Utility functions for time formatting
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function parseTimeInput(input: string): number {
  // Parse various time formats: "5", "5m", "1h 30m", "1:30", etc.
  const cleanInput = input.toLowerCase().trim();
  
  // Format: "1:30" or "1:30:45"
  const colonMatch = cleanInput.match(/^(\d+):(\d+)(?::(\d+))?$/);
  if (colonMatch) {
    const hours = parseInt(colonMatch[1]);
    const minutes = parseInt(colonMatch[2]);
    const seconds = parseInt(colonMatch[3] || '0');
    return hours * 60 + minutes + seconds / 60;
  }
  
  // Format: "1h 30m" or "30m" or "45s"
  let totalMinutes = 0;
  
  const hourMatch = cleanInput.match(/(\d+(?:\.\d+)?)\s*h/);
  if (hourMatch) {
    totalMinutes += parseFloat(hourMatch[1]) * 60;
  }
  
  const minuteMatch = cleanInput.match(/(\d+(?:\.\d+)?)\s*m/);
  if (minuteMatch) {
    totalMinutes += parseFloat(minuteMatch[1]);
  }
  
  const secondMatch = cleanInput.match(/(\d+(?:\.\d+)?)\s*s/);
  if (secondMatch) {
    totalMinutes += parseFloat(secondMatch[1]) / 60;
  }
  
  // If no units found, assume minutes
  if (totalMinutes === 0) {
    const numberMatch = cleanInput.match(/^(\d+(?:\.\d+)?)$/);
    if (numberMatch) {
      totalMinutes = parseFloat(numberMatch[1]);
    }
  }
  
  return totalMinutes;
}

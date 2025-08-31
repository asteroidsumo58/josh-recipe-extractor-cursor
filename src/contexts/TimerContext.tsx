'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useTimer, UseTimerReturn } from '@/hooks/useTimer';

const TimerContext = createContext<UseTimerReturn | null>(null);

interface TimerProviderProps {
  children: ReactNode;
}

export function TimerProvider({ children }: TimerProviderProps) {
  const timerState = useTimer();

  return (
    <TimerContext.Provider value={timerState}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimerContext(): UseTimerReturn {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
}

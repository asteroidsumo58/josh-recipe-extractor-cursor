'use client'

import { useMemo, useState } from 'react'
import { Clock3, Pause, Play, RotateCcw, Trash2 } from 'lucide-react'

import { Duration } from '@/types/recipe'
import { useTimerContext } from '@/contexts/TimerContext'
import { formatTime } from '@/hooks/useTimer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TimerButtonProps {
  duration: Duration
  stepNumber: number
  className?: string
}

export default function TimerButton({ duration, stepNumber, className }: TimerButtonProps) {
  const { createTimer, startTimer, pauseTimer, resetTimer, deleteTimer, timers } = useTimerContext()
  const [customEditorOpen, setCustomEditorOpen] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(duration.minutes)

  const existingTimer = useMemo(() => {
    const stepTimers = timers.filter((timer) => timer.label.startsWith(`Step ${stepNumber}`))
    const running = stepTimers.find((timer) => timer.isRunning)
    return running || stepTimers[0]
  }, [timers, stepNumber])

  const handleStartTimer = () => {
    if (existingTimer && existingTimer.totalSeconds === duration.minutes * 60) {
      startTimer(existingTimer.id)
      return
    }
    const timerId = createTimer(`Step ${stepNumber} · ${duration.display}`, duration.minutes)
    startTimer(timerId)
  }

  const handleCreateCustom = () => {
    if (customMinutes <= 0) return
    const timerId = createTimer(`Step ${stepNumber} · custom`, customMinutes)
    startTimer(timerId)
    setCustomEditorOpen(false)
  }

  if (existingTimer) {
    return (
      <div
        className={cn(
          'flex flex-col gap-2 rounded-xl border border-primary/40 bg-primary/5 p-4 text-sm text-primary-foreground',
          className
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Clock3 className="size-4" /> Step {stepNumber}
            <Badge variant="outline" className="border-primary/40 text-xs text-primary">
              {formatTime(existingTimer.totalSeconds)} total
            </Badge>
          </div>
          <div className="font-mono text-base text-primary">
            {formatTime(existingTimer.remainingSeconds)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {existingTimer.isRunning ? (
            <Button size="sm" variant="secondary" onClick={() => pauseTimer(existingTimer.id)}>
              <Pause className="mr-2 size-4" /> Pause
            </Button>
          ) : (
            <Button size="sm" onClick={() => startTimer(existingTimer.id)}>
              <Play className="mr-2 size-4" /> Resume
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => resetTimer(existingTimer.id)}>
            <RotateCcw className="mr-2 size-4" /> Reset
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => deleteTimer(existingTimer.id)}
          >
            <Trash2 className="mr-2 size-4" /> Remove
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleStartTimer} size="sm">
          <Clock3 className="mr-2 size-4" /> Start {duration.display}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setCustomEditorOpen((open) => !open)}
        >
          Custom timer
        </Button>
      </div>
      {customEditorOpen && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-background/80 p-3">
          <Input
            type="number"
            min={1}
            max={360}
            value={customMinutes}
            onChange={(event) => setCustomMinutes(Number(event.target.value))}
            className="w-24"
          />
          <span className="text-xs text-muted-foreground">minutes</span>
          <Button type="button" size="sm" onClick={handleCreateCustom}>
            Start
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setCustomEditorOpen(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

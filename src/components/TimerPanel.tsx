'use client'

import { useState } from 'react'
import { Play, Pause, RotateCcw, Trash2, PencilLine } from 'lucide-react'

import { useTimerContext } from '@/contexts/TimerContext'
import { formatTime, parseTimeInput, Timer } from '@/hooks/useTimer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TimerPanelProps {
  className?: string
}

export default function TimerPanel({ className }: TimerPanelProps) {
  const { timers, createTimer, startTimer, pauseTimer, resetTimer, deleteTimer, updateTimerLabel } =
    useTimerContext()

  const [newTimerInput, setNewTimerInput] = useState('')
  const [newTimerLabel, setNewTimerLabel] = useState('')
  const [editingTimer, setEditingTimer] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  const handleCreateTimer = () => {
    const minutes = parseTimeInput(newTimerInput)
    if (minutes <= 0) return

    const label = newTimerLabel.trim() || `Timer ${minutes}m`
    createTimer(label, minutes)
    setNewTimerInput('')
    setNewTimerLabel('')
  }

  const handleEditLabel = (timer: Timer) => {
    setEditingTimer(timer.id)
    setEditLabel(timer.label)
  }

  const handleSaveLabel = () => {
    if (editingTimer && editLabel.trim()) {
      updateTimerLabel(editingTimer, editLabel.trim())
    }
    setEditingTimer(null)
    setEditLabel('')
  }

  const activeTimers = timers.filter((timer) => !timer.isCompleted)
  const completedTimers = timers.filter((timer) => timer.isCompleted)

  const timerEmpty = timers.length === 0

  return (
    <div className={cn('space-y-6 p-6', className)}>
      <section className="space-y-3 rounded-xl border border-border/70 bg-background/70 p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Add custom timer</p>
          <p className="text-xs text-muted-foreground">
            Supports natural formats like “4:30”, “90s”, or “1h 10m”.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
          <div className="space-y-2">
            <Label htmlFor="timer-label" className="text-xs uppercase tracking-wide text-muted-foreground">
              Label
            </Label>
            <Input
              id="timer-label"
              placeholder="Roast peppers"
              value={newTimerLabel}
              onChange={(event) => setNewTimerLabel(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timer-duration" className="text-xs uppercase tracking-wide text-muted-foreground">
              Duration
            </Label>
            <div className="flex gap-2">
              <Input
                id="timer-duration"
                value={newTimerInput}
                placeholder="12m"
                onChange={(event) => setNewTimerInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleCreateTimer()}
              />
              <Button
                type="button"
                onClick={handleCreateTimer}
                disabled={!newTimerInput.trim() || parseTimeInput(newTimerInput) <= 0}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </section>

      {timerEmpty && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/70 bg-background/60 p-8 text-center text-sm text-muted-foreground">
          <Badge variant="outline">No timers yet</Badge>
          <p>Start from a recipe step or create a custom countdown above.</p>
        </div>
      )}

      {activeTimers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Active timers</p>
            <Badge variant="outline">{activeTimers.length}</Badge>
          </div>
          <div className="space-y-3">
            {activeTimers.map((timer) => {
              const progress = ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100
              return (
                <div
                  key={timer.id}
                  className="rounded-xl border border-border/70 bg-background/80 p-4 transition-colors"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {editingTimer === timer.id ? (
                      <div className="flex w-full max-w-sm items-center gap-2">
                        <Input
                          value={editLabel}
                          onChange={(event) => setEditLabel(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') handleSaveLabel()
                            if (event.key === 'Escape') {
                              setEditingTimer(null)
                              setEditLabel('')
                            }
                          }}
                          autoFocus
                        />
                        <Button type="button" size="sm" onClick={handleSaveLabel}>
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTimer(null)
                            setEditLabel('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditLabel(timer)}
                        className="inline-flex items-center gap-2 text-left text-sm font-medium text-foreground transition-colors hover:text-primary"
                      >
                        <PencilLine className="size-3.5 text-muted-foreground" />
                        {timer.label}
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      {timer.isRunning ? (
                        <Button type="button" size="sm" variant="secondary" onClick={() => pauseTimer(timer.id)}>
                          <Pause className="mr-2 size-4" /> Pause
                        </Button>
                      ) : (
                        <Button type="button" size="sm" onClick={() => startTimer(timer.id)}>
                          <Play className="mr-2 size-4" /> Start
                        </Button>
                      )}
                      <Button type="button" size="sm" variant="outline" onClick={() => resetTimer(timer.id)}>
                        <RotateCcw className="mr-2 size-4" /> Reset
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTimer(timer.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatTime(timer.remainingSeconds)} remaining</span>
                      <span>{formatTime(timer.totalSeconds)} total</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {completedTimers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Completed</p>
            <Badge variant="outline">{completedTimers.length}</Badge>
          </div>
          <div className="space-y-2">
            {completedTimers.map((timer) => (
              <div
                key={timer.id}
                className="flex items-center justify-between rounded-xl border border-emerald-200/70 bg-emerald-500/10 px-4 py-3 text-sm"
              >
                <div className="flex items-center gap-2 text-emerald-700">
                  <Badge variant="outline" className="border-emerald-400 text-xs text-emerald-700">Done</Badge>
                  <span className="font-medium text-emerald-800">{timer.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => resetTimer(timer.id)}>
                    Restart
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteTimer(timer.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

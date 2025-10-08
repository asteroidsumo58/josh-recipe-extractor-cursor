'use client'

import { memo, useCallback, useState } from 'react'
import { Minus, Plus, Sparkles } from 'lucide-react'

import { getSuggestedServings } from '@/hooks/useRecipeScaling'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface ServingsControlProps {
  originalServings: number
  currentServings: number
  scalingMultiplier: number
  onServingsChange: (servings: number) => void
  onReset: () => void
  canScaleDown: boolean
  canScaleUp: boolean
  className?: string
}

function ServingsControl({
  originalServings,
  currentServings,
  scalingMultiplier,
  onServingsChange,
  onReset,
  canScaleDown,
  canScaleUp,
  className,
}: ServingsControlProps) {
  const [customInput, setCustomInput] = useState('')
  const [customOpen, setCustomOpen] = useState(false)

  const suggestedServings = getSuggestedServings(originalServings)

  const handleIncrement = useCallback(() => {
    if (canScaleUp) onServingsChange(currentServings + 1)
  }, [canScaleUp, currentServings, onServingsChange])

  const handleDecrement = useCallback(() => {
    if (canScaleDown) onServingsChange(currentServings - 1)
  }, [canScaleDown, currentServings, onServingsChange])

  const handleCustomSubmit = () => {
    const parsed = parseInt(customInput, 10)
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 50) {
      onServingsChange(parsed)
      setCustomInput('')
      setCustomOpen(false)
    }
  }

  const scaleHint = (() => {
    if (scalingMultiplier === 1) return 'Original recipe'
    if (scalingMultiplier === 0.5) return 'Half recipe'
    if (scalingMultiplier === 2) return 'Double recipe'
    if (scalingMultiplier < 1) return `${Math.round(scalingMultiplier * 100)}% of original`
    return `${scalingMultiplier.toFixed(2)}× original`
  })()

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Servings</p>
          <p className="text-xs text-muted-foreground">Adjust quantities and inline mentions in one tap.</p>
        </div>
        {scalingMultiplier !== 1 && (
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            Reset
          </Button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={handleDecrement}
          disabled={!canScaleDown}
          className="rounded-full"
        >
          <Minus className="size-4" />
        </Button>
        <div className="text-center">
          <div className="text-3xl font-semibold text-foreground" aria-live="polite">
            {currentServings}
          </div>
          <p className="text-xs text-muted-foreground">
            {currentServings === 1 ? 'serving' : 'servings'} · {scaleHint}
          </p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={handleIncrement}
          disabled={!canScaleUp}
          className="rounded-full"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {suggestedServings.map((servings) => (
          <Button
            key={servings}
            type="button"
            size="sm"
            variant={currentServings === servings ? 'default' : 'outline'}
            className="justify-center"
            onClick={() => onServingsChange(servings)}
          >
            {servings}
          </Button>
        ))}
      </div>

      <div className="mt-4 space-y-3 rounded-xl border border-dashed border-border/70 bg-background/70 p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="size-3" />
          <span>Custom range (1–50 servings)</span>
        </div>
        {customOpen ? (
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              max={50}
              value={customInput}
              onChange={(event) => setCustomInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleCustomSubmit()}
              placeholder="Enter servings"
              className="flex-1"
              autoFocus
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCustomOpen(false)
                setCustomInput('')
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleCustomSubmit} disabled={!customInput.trim()}>
              Set
            </Button>
          </div>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={() => setCustomOpen(true)}>
            Enter custom amount
          </Button>
        )}
      </div>

      <div className="mt-4 grid gap-2 rounded-xl border border-border/70 bg-background/60 p-3 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Original recipe</span>
          <Badge variant="outline">{originalServings} servings</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span>Current yield</span>
          <Badge variant="outline">{currentServings} servings</Badge>
        </div>
      </div>
    </div>
  )
}

export default memo(ServingsControl)

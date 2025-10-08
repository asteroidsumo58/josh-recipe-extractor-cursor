'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RecipeFormProps {
  onSubmit: (url: string) => void
  loading: boolean
}

export default function RecipeForm({ onSubmit, loading }: RecipeFormProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!url.trim()) {
      setError('Please enter a recipe URL')
      return
    }

    try {
      new URL(url)
      setError('')
      onSubmit(url.trim())
    } catch {
      setError('Please enter a valid URL')
    }
  }

  const quickSuggestions = [
    {
      label: 'AllRecipes test',
      url: 'https://www.allrecipes.com/recipe/20680/easy-mexican-casserole/',
    },
    {
      label: 'Downshiftology test',
      url: 'https://downshiftology.com/recipes/mediterranean-ground-beef-stir-fry/',
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="recipe-url">Recipe URL</Label>
        <div className="relative">
          <Input
            id="recipe-url"
            type="url"
            placeholder="https://example.com/recipe"
            value={url}
            disabled={loading}
            onChange={(event) => {
              setUrl(event.target.value)
              if (error) setError('')
            }}
            aria-describedby={error ? 'recipe-url-error' : undefined}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 size-5 -translate-y-1/2 animate-spin text-primary" />
          )}
        </div>
        {error && (
          <p id="recipe-url-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Need a quick test?</span>
        {quickSuggestions.map((item) => (
          <Button
            key={item.label}
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full border-dashed text-xs"
            onClick={() => {
              if (!loading) {
                setUrl(item.url)
                setError('')
              }
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <Button type="submit" className="w-full" disabled={loading || !url.trim()}>
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Extracting recipe…
          </span>
        ) : (
          'Extract recipe'
        )}
      </Button>
    </form>
  )
}

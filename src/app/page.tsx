'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Clock3, Home, Info, Menu, Sparkles, UtensilsCrossed } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ThemeToggle from '@/components/ThemeToggle'
import RecipeForm from '@/components/RecipeForm'
import RecipeView from '@/components/RecipeView'
import ErrorDisplay from '@/components/ErrorDisplay'
import { RecipeLoadingState } from '@/components/LoadingSpinner'
import { Recipe } from '@/types/recipe'
import { ParseError } from '@/types/api'
import { TimerProvider } from '@/contexts/TimerContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

type AppState = 'form' | 'loading' | 'recipe' | 'error'

export default function Home() {
  const [state, setState] = useState<AppState>('form')
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [error, setError] = useState<ParseError | null>(null)
  const [currentUrl, setCurrentUrl] = useState<string>('')

  const handleSubmit = async (url: string) => {
    setState('loading')
    setCurrentUrl(url)
    setError(null)
    setRecipe(null)

    try {
      const response = await fetch(`/api/parse?url=${encodeURIComponent(url)}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data)
        setState('error')
        return
      }

      setRecipe(data)
      setState('recipe')
    } catch (err) {
      console.error(err)
      setError({
        error: 'fetch_failed',
        message:
          'Failed to connect to the server. Please check your internet connection and try again.',
        suggestion: 'Make sure you have a stable internet connection and the URL is accessible.',
      })
      setState('error')
    }
  }

  const handleRetry = () => {
    if (currentUrl) {
      handleSubmit(currentUrl)
    }
  }

  const handleReset = () => {
    setState('form')
    setRecipe(null)
    setError(null)
    setCurrentUrl('')
  }

  const handleBack = () => {
    setState('form')
    setRecipe(null)
  }

  const headerTitle = useMemo(() => {
    if (state === 'recipe' && recipe) {
      return recipe.title
    }
    if (state === 'error') {
      return 'Something went wrong'
    }
    if (state === 'loading') {
      return 'Extracting recipe'
    }
    return 'Recipe Extractor'
  }, [recipe, state])

  const headerSubtitle = useMemo(() => {
    if (state === 'recipe' && recipe) {
      return `From ${recipe.domain} — parsed via ${recipe.source}`
    }
    if (state === 'error' && error) {
      return error.message
    }
    if (state === 'loading') {
      return 'Collecting ingredients, steps, timers, and basic metadata'
    }
    return 'Paste any recipe URL to pull a clean, readable version with timers and scaling'
  }, [error, recipe, state])

  return (
    <ErrorBoundary>
      <TimerProvider>
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col">
          <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h1 className="text-xl font-semibold leading-tight text-foreground sm:text-2xl">{headerTitle}</h1>
                <p className="text-sm text-muted-foreground">{headerSubtitle}</p>
                {state === 'recipe' && recipe && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{recipe.domain}</Badge>
                    <Badge variant="outline">{recipe.source}</Badge>
                    {recipe.servings && <Badge variant="outline">{recipe.servings} servings</Badge>}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {recipe && (
                  <Badge variant="outline" className="hidden sm:inline-flex">
                    Parsed in {recipe.parseTime}ms
                  </Badge>
                )}
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-10">
            {state === 'form' && (
              <div className="space-y-6">
                <Card className="border-border/70 bg-background/95 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">Paste a recipe URL</CardTitle>
                    <CardDescription>
                      The parser grabs structured data when available and falls back to heuristics for ingredients and
                      instructions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <RecipeForm onSubmit={handleSubmit} loading={state === 'loading'} />
                  </CardContent>
                </Card>

                <Card className="border-border/70 bg-card/80 shadow-sm">
                  <CardHeader>
                    <CardTitle>Sample recipes</CardTitle>
                    <CardDescription>Use one of these if you just need a quick demo.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {sampleLinks.map((item) => (
                        <Card key={item.url} className="border-dashed border-border/60 bg-card">
                          <CardContent className="space-y-3 p-4">
                            <p className="text-sm font-medium text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleSubmit(item.url)}
                            >
                              Use this recipe
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {state === 'loading' && (
              <Card className="border-border/70 bg-background/95">
                <CardHeader className="flex items-center gap-3 pb-3">
                  <LoaderIndicator />
                  <div>
                    <CardTitle className="text-base font-semibold">Extracting recipe</CardTitle>
                    <CardDescription>Fetching structured data and snapshots from the target page.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <RecipeLoadingState />
                </CardContent>
              </Card>
            )}

            {state === 'error' && error && (
              <Card className="border-destructive/40 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-base text-destructive">Unable to parse recipe</CardTitle>
                  <CardDescription className="text-sm text-destructive/80">
                    Something went wrong while fetching {currentUrl}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ErrorDisplay error={error} />
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  <Button variant="destructive" onClick={handleRetry}>
                    Retry URL
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    Try another recipe
                  </Button>
                </CardFooter>
              </Card>
            )}

            {state === 'recipe' && recipe && (
              <div className="space-y-6">
                <RecipeView recipe={recipe} onBack={handleBack} />

                <Card className="border-border/70 bg-background/90">
                  <CardHeader>
                    <CardTitle className="text-base">Recipe metrics</CardTitle>
                    <CardDescription>Quick stats surfaced from the parsed data.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <MetricCard label="Source" value={recipe.source} icon={<UtensilsCrossed className="size-4" />} />
                      <MetricCard label="Domain" value={recipe.domain} icon={<Home className="size-4" />} />
                      <MetricCard label="Parse time" value={`${recipe.parseTime} ms`} icon={<Clock3 className="size-4" />} />
                      {recipe.instructions && (
                        <MetricCard label="Instruction steps" value={recipe.instructions.length} icon={<Sparkles className="size-4" />} />
                      )}
                      {recipe.ingredients && (
                        <MetricCard label="Ingredients" value={recipe.ingredients.length} icon={<Info className="size-4" />} />
                      )}
                      {recipe.servings && (
                        <MetricCard label="Servings" value={recipe.servings} icon={<Menu className="size-4" />} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </TimerProvider>
    </ErrorBoundary>
  )
}

const sampleLinks = [
  {
    label: 'Quick & Cozy',
    description: 'AllRecipes taco casserole with timers already embedded',
    url: 'https://www.allrecipes.com/recipe/20680/easy-mexican-casserole/',
  },
  {
    label: 'Weeknight Stir Fry',
    description: 'Downshiftology Mediterranean beef stir fry snapshot',
    url: 'https://downshiftology.com/recipes/mediterranean-ground-beef-stir-fry/',
  },
  {
    label: 'Pasta Classic',
    description: 'Food Network cacio e uova reference recipe',
    url: 'https://www.foodnetwork.com/recipes/food-network-kitchen/extra-creamy-cacio-e-uova-with-grated-egg-12646498',
  },
]

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: ReactNode
}) {
  return (
    <Card className="border-border/70 bg-card">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-base font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function LoaderIndicator() {
  return (
    <div className="flex size-8 items-center justify-center rounded-full border border-border/60">
      <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

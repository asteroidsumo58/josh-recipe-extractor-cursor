'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Recipe, ParsedIngredient, RecipeInstruction } from '@/types/recipe'
import { formatIngredientForStep } from '@/lib/parsers/ingredient-parser'
import { useRecipeScaling } from '@/hooks/useRecipeScaling'
import TimerButton from './TimerButton'
import TimerPanel from './TimerPanel'
import ServingsControl from './ServingsControl'
import {
  ArrowLeft,
  Check,
  Clock3,
  ChefHat,
  Sparkles,
  Utensils,
} from 'lucide-react'

interface RecipeViewProps {
  recipe: Recipe
  onBack: () => void
}

interface IngredientCheckState {
  [key: number]: boolean
}

interface StepCheckState {
  [key: number]: boolean
}

function RecipeView({ recipe, onBack }: RecipeViewProps) {
  const [checkedIngredients, setCheckedIngredients] = useState<IngredientCheckState>({})
  const [checkedSteps, setCheckedSteps] = useState<StepCheckState>({})

  const {
    scaledRecipe,
    currentServings,
    originalServings,
    scalingMultiplier,
    setServings,
    resetToOriginal,
    canScaleDown,
    canScaleUp,
  } = useRecipeScaling(recipe)

  const toggleIngredient = useCallback((index: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }, [])

  const toggleStep = useCallback((index: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }, [])

  const meta = useMemo(
    () => [
      {
        label: 'Total time',
        value: scaledRecipe.totalTime,
        icon: <Clock3 className="size-4" />,
      },
      {
        label: 'Prep',
        value: scaledRecipe.prepTime,
        icon: <ChefHat className="size-4" />,
      },
      {
        label: 'Cook',
        value: scaledRecipe.cookTime,
        icon: <Utensils className="size-4" />,
      },
      {
        label: 'Servings',
        value: `${currentServings}${scalingMultiplier !== 1 ? ` · scaled ×${scalingMultiplier.toFixed(2)}` : ''}`,
        icon: <Sparkles className="size-4" />,
      },
    ],
    [currentServings, scaledRecipe, scalingMultiplier]
  )

  const renderIngredientInline = useCallback((ingredient: ParsedIngredient) => {
    return (
      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        {formatIngredientForStep(ingredient)}
      </span>
    )
  }, [])

  const renderStepWithIngredients = useCallback(
    (instruction: RecipeInstruction) => {
      if (!instruction.ingredients || instruction.ingredients.length === 0) {
        return instruction.text
      }

      let text = instruction.text
      const ingredientMatches: { ingredient: ParsedIngredient; name: string }[] = []

      instruction.ingredients.forEach((ingredientName) => {
        const norm = (value: string) =>
          value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const target = norm(ingredientName)
        const ingredient = scaledRecipe.ingredients.find((ing) => {
          const ingName = norm(ing.ingredient)
          if (ingName.includes(target) || target.includes(ingName)) return true
          const ingBase = ingName.replace(/\blean\b/g, '').replace(/\s+/g, ' ').trim()
          const tgtBase = target.replace(/\blean\b/g, '').replace(/\s+/g, ' ').trim()
          if (ingBase.includes(tgtBase) || tgtBase.includes(ingBase)) return true
          if (ingBase.endsWith('s') && ingBase.slice(0, -1) === tgtBase) return true
          if (tgtBase.endsWith('s') && tgtBase.slice(0, -1) === ingBase) return true
          return false
        })
        if (ingredient) {
          ingredientMatches.push({ ingredient, name: ingredientName })
        }
      })

      ingredientMatches
        .sort((a, b) => b.name.length - a.name.length)
        .forEach(({ ingredient, name }) => {
          const placeholder = `__INGREDIENT_${ingredient.ingredient}__`
          const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const qtyUnitsPattern = String.raw`(?:\b\d[\d\s\/.¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞\-]*\s*(?:[a-zA-Z\.]+\s+)*)?`
          const extended = new RegExp(`${qtyUnitsPattern}\\b${escapedName}\\b`, 'gi')

          const before = text
          text = text.replace(extended, placeholder)

          if (text === before) {
            const nameOnly = new RegExp(`\\b${escapedName}\\b`, 'gi')
            text = text.replace(nameOnly, placeholder)
          }

          if (text === before) {
            const tokens = name.split(/\s+/).filter(Boolean)
            const tail = tokens[tokens.length - 1] || ''
            const mkVariants = (base: string): string[] => {
              const variants: string[] = []
              const esc = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
              if (!base) return variants
              const lower = base.toLowerCase()
              variants.push(esc(lower))
              if (lower.endsWith('ies')) variants.push(esc(lower.replace(/ies$/, 'y')))
              if (lower.endsWith('es')) variants.push(esc(lower.replace(/es$/, '')))
              if (lower.endsWith('s')) variants.push(esc(lower.slice(0, -1)))
              if (!lower.endsWith('s')) variants.push(esc(`${lower}s`))
              if (lower.endsWith('o')) variants.push(esc(`${lower}es`))
              return Array.from(new Set(variants))
            }
            const variants = [tail, name].flatMap(mkVariants).filter(Boolean)
            for (const variant of variants) {
              const re = new RegExp(`\\b${variant}\\b`, 'gi')
              const beforeToken = text
              text = text.replace(re, placeholder)
              if (text !== beforeToken) break
            }
          }
        })

      const parts = text.split(/__INGREDIENT_([^_]+)__/)

      return (
        <span>
          {parts.map((part, index) => {
            if (index % 2 === 0) {
              return <span key={index}>{part}</span>
            } else {
              const ingredient = scaledRecipe.ingredients.find((ing) => ing.ingredient === part)
              return ingredient ? <span key={index}>{renderIngredientInline(ingredient)}</span> : <span key={index}>{part}</span>
            }
          })}
        </span>
      )
    },
    [renderIngredientInline, scaledRecipe.ingredients]
  )

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-background/90 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="group gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              Back to workspace
            </Button>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{scaledRecipe.domain}</Badge>
              <Badge variant="outline">Parsed via {scaledRecipe.source}</Badge>
              <Badge variant="outline">{scaledRecipe.parseTime} ms</Badge>
              {scalingMultiplier !== 1 && (
                <Badge variant="outline">Scaled ×{scalingMultiplier.toFixed(2)}</Badge>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold leading-tight text-foreground">
              {scaledRecipe.title}
            </CardTitle>
            {scaledRecipe.description && (
              <CardDescription className="text-base leading-relaxed text-muted-foreground">
                {scaledRecipe.description}
              </CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {meta
              .filter((item) => item.value)
              .map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/80 px-4 py-3"
                >
                  <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="border-border/70 bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Ingredients</CardTitle>
              <CardDescription>
                Check items off as you prep. Scaling updates both the list and inline mentions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ServingsControl
                originalServings={originalServings}
                currentServings={currentServings}
                scalingMultiplier={scalingMultiplier}
                onServingsChange={setServings}
                onReset={resetToOriginal}
                canScaleDown={canScaleDown}
                canScaleUp={canScaleUp}
              />
              <Separator />
              <ScrollArea className="h-[420px] pr-2">
                <div className="space-y-3" role="list" aria-label="Ingredients">
                  {scaledRecipe.ingredients.map((ingredient, index) => (
                    <label
                      key={`ingredient-${index}`}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-xl border border-border/70 bg-background/70 p-3 transition-colors',
                        checkedIngredients[index] && 'border-primary/40 bg-primary/5'
                      )}
                      role="listitem"
                    >
                      <input
                        type="checkbox"
                        checked={checkedIngredients[index] || false}
                        onChange={() => toggleIngredient(index)}
                        className="mt-1 size-4 rounded border-border/70 text-primary focus:ring-primary"
                        aria-label={`Mark ${ingredient.ingredient} as completed`}
                      />
                      <div className={cn('text-sm leading-relaxed text-foreground', checkedIngredients[index] && 'opacity-70 line-through')}>
                        {ingredient.quantity && (
                          <span className="font-medium text-foreground">{ingredient.quantity} </span>
                        )}
                        {ingredient.unit && (
                          <span className="font-medium text-foreground">{ingredient.unit} </span>
                        )}
                        <span>{ingredient.ingredient}</span>
                        {ingredient.preparation && (
                          <span className="text-muted-foreground"> — {ingredient.preparation}</span>
                        )}
                        {ingredient.optional && (
                          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                            Optional
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Timers</CardTitle>
              <CardDescription>Manage kitchen countdowns without leaving the recipe.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <TimerPanel />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {scaledRecipe.images.length > 0 && (
            <Card className="border-border/70 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Gallery</CardTitle>
                <CardDescription>Swipe through hero imagery pulled from the source.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Accordion type="single" collapsible defaultValue="image">
                  <AccordionItem value="image" className="border-none">
                    <AccordionTrigger className="px-5 text-sm font-medium text-muted-foreground hover:no-underline">
                      {scaledRecipe.images.length} image{scaledRecipe.images.length > 1 ? 's' : ''}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="relative">
                        <Carousel className="w-full">
                          <CarouselContent>
                            {scaledRecipe.images.slice(0, 5).map((image, index) => (
                              <CarouselItem key={image + index}>
                                <div className="relative h-64 w-full overflow-hidden rounded-b-xl">
                                  <Image
                                    src={image}
                                    alt={`${scaledRecipe.title} image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 40vw"
                                  />
                                </div>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          <CarouselPrevious className="left-4 bg-background/80" />
                          <CarouselNext className="right-4 bg-background/80" />
                        </Carousel>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/70 bg-card">
            <CardHeader>
              <CardTitle className="text-base">Instructions</CardTitle>
              <CardDescription>
                Tap a step to mark it complete. Timers surface automatically when durations are detected.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scaledRecipe.instructions.map((instruction, index) => {
                const isChecked = checkedSteps[index]
                return (
                  <div
                    key={`instruction-${instruction.step}`}
                    className={cn(
                      'rounded-xl border border-border/70 bg-background/90 p-4 transition-colors',
                      isChecked && 'border-primary/40 bg-primary/5'
                    )}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleStep(index)}
                          className={cn(
                            buttonVariants({ variant: isChecked ? 'default' : 'outline', size: 'icon' }),
                            'mt-0.5 rounded-full'
                          )}
                          aria-label={`Mark step ${instruction.step} as ${isChecked ? 'incomplete' : 'complete'}`}
                        >
                          {isChecked ? <Check className="size-4" /> : instruction.step}
                        </button>
                        <div className={cn('space-y-2 text-sm leading-relaxed text-foreground', isChecked && 'opacity-70 line-through')}>
                          {renderStepWithIngredients(instruction)}
                          {instruction.ingredients && instruction.ingredients.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>Uses:</span>
                              {instruction.ingredients.map((ing, ingIndex) => (
                                <Badge key={`${instruction.step}-${ingIndex}`} variant="outline">
                                  {ing}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {instruction.duration && (
                        <TimerButton duration={instruction.duration} stepNumber={instruction.step} className="sm:self-start" />
                      )}
                    </div>
                  </div>
                )}
              )}
            </CardContent>
            {scaledRecipe.author && (
              <CardFooter className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                Recipe by <span className="font-medium text-foreground">{scaledRecipe.author}</span>
                {scalingMultiplier !== 1 && (
                  <Badge variant="outline" className="ml-auto">Scaled ×{scalingMultiplier.toFixed(2)}</Badge>
                )}
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default memo(RecipeView)

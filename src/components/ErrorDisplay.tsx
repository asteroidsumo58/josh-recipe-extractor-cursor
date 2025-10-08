'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ParseError } from '@/types/api'

interface ErrorDisplayProps {
  error: ParseError
  onRetry: () => void
  onReset: () => void
}

export default function ErrorDisplay({ error, onRetry, onReset }: ErrorDisplayProps) {
  const detail = getErrorDetails(error)
  const canRetry = error.error === 'fetch_failed' || error.error === 'rate_limit_exceeded'

  return (
    <div className="space-y-6">
      <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
        <AlertTitle className="flex items-center gap-2 text-base">
          <Badge variant="outline" className="border-destructive/50 text-destructive">
            {detail.icon}
          </Badge>
          {detail.title}
        </AlertTitle>
        <AlertDescription className="mt-3 space-y-2 text-sm">
          <p>{error.message}</p>
          {detail.message && <p className="text-muted-foreground">{detail.message}</p>}
        </AlertDescription>
      </Alert>

      <div className="rounded-xl border border-border/70 bg-background/80 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">What to try next</p>
        <Separator className="my-3" />
        <ul className="space-y-2">
          {detail.suggestions.map((suggestion) => (
            <li key={suggestion} className="flex items-start gap-2">
              <span className="mt-1 inline-block size-1.5 rounded-full bg-destructive" />
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        {canRetry && (
          <Button type="button" onClick={onRetry}>
            Retry request
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onReset}>
          Try a different URL
        </Button>
      </div>
    </div>
  )
}

function getErrorDetails(error: ParseError) {
  switch (error.error) {
    case 'fetch_failed':
      return {
        icon: '🌐',
        title: 'Connection issue',
        message: 'We could not reach the recipe site. It might be offline or blocking automated requests.',
        suggestions: [
          'Verify the page loads in your browser',
          'Try again in a moment',
          'Use a different network if the site blocks bots',
        ],
      }
    case 'no_recipe_found':
      return {
        icon: '🔍',
        title: 'No structured recipe data detected',
        message: 'The page might be a blog post or index without schema.org recipe markup.',
        suggestions: [
          'Make sure the URL points to a specific recipe detail page',
          'Look for a “Print recipe” link on the site',
          'Try a different recipe from the same publisher',
        ],
      }
    case 'invalid_url':
      return {
        icon: '⚠️',
        title: 'URL looks incomplete',
        message: 'Only full http(s) URLs are supported.',
        suggestions: [
          'Include the https:// at the beginning',
          'Copy the link directly from the browser address bar',
        ],
      }
    case 'forbidden_url':
      return {
        icon: '🚫',
        title: 'URL blocked for safety',
        message: 'Local and private network addresses are intentionally disallowed.',
        suggestions: [
          'Use a public recipe URL',
          'Avoid localhost or files on your computer',
        ],
      }
    case 'rate_limit_exceeded':
      return {
        icon: '⏳',
        title: 'Too many requests',
        message: 'We allow up to 10 requests per minute to keep the service responsive for everyone.',
        suggestions: [
          'Wait a minute before trying again',
          'Queue multiple URLs and paste them one at a time',
        ],
      }
    default:
      return {
        icon: '❌',
        title: 'Unexpected error',
        message: '',
        suggestions: [
          'Reload the app and try again',
          'Attempt a different recipe URL',
        ],
      }
  }
}

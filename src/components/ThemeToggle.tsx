'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { themeDebugger } from '@/lib/theme-debug'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  const handleClick = () => {
    themeDebugger.log(`🖱️ Theme toggle clicked, current theme: ${theme}`)
    try {
      toggleTheme()
      themeDebugger.log('✅ Toggle function called successfully')
    } catch (error) {
      themeDebugger.error('❌ Error calling toggle function:', error)
    }
  }

  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className="relative inline-flex size-11 items-center justify-center rounded-xl border border-border/80 bg-background/80 shadow-sm transition hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`Switch to ${nextTheme} mode`}
        >
          <svg
            className={`absolute size-5 text-amber-500 transition-all duration-300 ease-in-out ${
              theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-75'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
          <svg
            className={`absolute size-5 text-sky-400 transition-all duration-300 ease-in-out ${
              theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </button>
      </TooltipTrigger>
      <TooltipContent>{`Switch to ${nextTheme} mode`}</TooltipContent>
    </Tooltip>
  )
}

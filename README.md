# Recipe Extractor 🍳

A modern, intelligent recipe extraction and management application built with Next.js 15. Extract recipes from any URL with smart parsing, automatic scaling, built-in timers, and kitchen-friendly features.

![Recipe Extractor Demo](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Recipe+Extractor+Demo)

## ✨ Features

### 🔍 **Smart Recipe Parsing**
- **JSON-LD Support**: Primary extraction method for structured recipe data
- **Microdata/RDFa Fallback**: Secondary parsing for older recipe formats  
- **HTML Heuristics**: Intelligent fallback parsing when structured data isn't available
- **Multi-source Support**: Works with AllRecipes, Food Network, Serious Eats, and thousands of food blogs

### ⏱️ **Built-in Kitchen Timers**
- **Auto-detection**: Automatically finds cooking times in recipe instructions
- **Multiple Timers**: Run multiple timers simultaneously for complex recipes
- **Inline Step Timers**: iOS-style circular countdown rendered directly within each recipe step
- **Custom Timers**: Use the “Custom…” button to set Hours/Minutes/Seconds for any step
- **Audible Alert**: Pulsing completion sound plays for ~10 seconds; browser notification (if permitted)
- **Visual Indicators**: Clear status indicators and notifications
- **Persistent State**: Timers continue running across page refreshes

### 📏 **Dynamic Recipe Scaling**
- **Smart Quantity Adjustment**: Automatically scales ingredient quantities and measurements
- **Fraction Formatting**: Intelligent conversion to readable fractions (e.g., 1.5 → "1 1/2")
- **Range Scaling**: Handles ingredient ranges (e.g., "2-3 cups" → "4-6 cups")
- **In-text Scaling**: Updates quantities mentioned within instruction text
- **Serving Suggestions**: Quick-select common serving sizes

### 🧩 **Inline Ingredients (Apr 2025)**
- **Prep-word normalization**: Strips words like "chopped", "shredded", "crushed" from ingredient names for matching in steps
- **Pluralization awareness**: Matches singular/plural variants (e.g., tomato ↔ tomatoes, olive ↔ olives)
- **Safer regex replacement**: Proper escaping with multi-variant fallback to avoid missed matches
- **More permissive fuzzy match**: Threshold tuned for real-world phrasing differences
- Example: AllRecipes step 4–5 now shows inline amounts for beans, chips, sour cream, olives, green onion, tomatoes, and cheese

### 🎯 **Kitchen-Friendly Interface**
- **Progress Tracking**: Check off ingredients and steps as you cook
- **Mobile Optimized**: Large tap targets and responsive design
- **Dark Mode**: Easy on the eyes during late-night cooking sessions
- **Accessibility**: Full keyboard navigation and screen reader support

### ⚡ **Performance & Reliability**
- **LRU Caching**: 24-hour recipe caching for faster repeated access
- **Rate Limiting**: 10 requests per minute per IP to ensure service stability
- **Error Handling**: Comprehensive error messages with helpful suggestions
- **Network-free Testing**: Complete test suite with HTML fixtures

## 🌐 Live Demo

**Try the app now**: [https://josh-recipe-extractor-cursor-61rl4tpgu-joshua-summers-projects.vercel.app/](https://josh-recipe-extractor-cursor-61rl4tpgu-joshua-summers-projects.vercel.app/)

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or 20.x
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/asteroidsumo58/josh-recipe-extractor-cursor.git
   cd josh-recipe-extractor-cursor
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Test Scripts
```bash
# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only E2E tests
npm run test:e2e

# Watch mode for development
npm run test:watch

# CI-optimized test run
npm run test:ci

# Fetch 50+ recipe snapshots (offline fixtures)
npm run fetch:recipes

# Batch-parse all snapshots via API route	n
npm run test:recipes

# Generate JSON/Markdown audit reports
npm run audit:recipes

# One-command refresh + audit pipeline
npm run pipeline:recipes
```

### Test Coverage
The project maintains comprehensive test coverage with:
- **62 test cases** across 7 test files
- **Unit tests** for all parsing and scaling logic
- **E2E tests** for complete API integration
- **HTML fixtures** for network-free testing
- **Batch recipe suite** for 50+ real-world snapshots
- **Audit reports** (JSON/Markdown) summarizing successes/failures by domain and feature coverage
- **Coverage thresholds** set to 70% across all metrics

### Snapshot & Audit Workflow
- Snapshots are saved to `src/test/fixtures/recipes/*.html` with an auto-generated `index.json`.
- Batch suite (`src/test/e2e-batch-recipes.test.ts`) mocks network using snapshots and exercises the real API.
- Audit suite (`src/test/e2e-audit.test.ts`) writes:
  - Per-recipe JSON outputs to `src/test/fixtures/recipes/results/*.json`
  - Aggregate `report.json` and `report.md` to `src/test/fixtures/recipes/`
- Anti-bot/placeholder pages may parse as failures; use the audit to focus parser improvements on real gaps.

### Timers – Usage Tips
- Click “Start …” to use the parsed duration for a step.
- Click “Custom…” to pick Hours/Minutes/Seconds, preview the HH:MM:SS, then “Create & Start”.
- When a timer completes, a ~10s pulsing alert plays and (if permitted) a notification appears.
- Timers are grouped by step; custom timers for the same step render inline with controls.

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS v4 with dark mode support
- **Testing**: Vitest + Testing Library + Playwright (optional)
- **Parsing**: Cheerio for HTML manipulation
- **Validation**: Zod for runtime type checking

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/parse/         # Recipe parsing API endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ErrorDisplay.tsx   # Error handling UI
│   ├── LoadingSpinner.tsx # Loading states
│   ├── RecipeForm.tsx     # URL input form
│   ├── RecipeView.tsx     # Recipe display
│   ├── ServingsControl.tsx # Scaling controls
│   ├── TimerButton.tsx    # Individual timer controls
│   └── TimerPanel.tsx     # Timer management
├── contexts/              # React contexts
│   └── TimerContext.tsx   # Global timer state
├── hooks/                 # Custom React hooks
│   ├── useRecipeScaling.ts # Recipe scaling logic
│   └── useTimer.ts        # Timer functionality
├── lib/                   # Utility libraries
│   ├── cache.ts           # LRU cache implementation
│   ├── rate-limiter.ts    # Rate limiting logic
│   ├── utils.ts           # General utilities
│   └── parsers/           # Recipe parsing logic
│       ├── html-heuristics.ts    # Fallback HTML parsing
│       ├── ingredient-parser.ts  # Ingredient processing
│       └── structured-data.ts    # JSON-LD/Microdata parsing
├── test/                  # Test files and fixtures
│   ├── fixtures/          # HTML test data
│   ├── *.test.ts         # Unit tests
│   └── setup.ts          # Test configuration
└── types/                 # TypeScript definitions
    └── recipe.ts          # Recipe data types
```

### API Design

#### `GET /api/parse?url={recipeUrl}`

**Parameters:**
- `url` (required): The recipe URL to parse

**Response:**
```typescript
{
  title: string;
  description?: string;
  ingredients: ParsedIngredient[];
  instructions: RecipeInstruction[];
  servings?: string;
  totalTime?: string;
  prepTime?: string;
  cookTime?: string;
  images: string[];
  source: 'json-ld' | 'microdata' | 'html-heuristics';
  url: string;
  domain: string;
  parseTime: number;
}
```

**Headers:**
- `X-Cache`: `HIT` or `MISS` indicating cache status
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `Retry-After`: Seconds to wait if rate limited (429 responses only)

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Deploy automatically on every push

### Docker
```bash
# Build the image
docker build -t recipe-extractor .

# Run the container
docker run -p 3000:3000 recipe-extractor
```

### Manual Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for local development:

```bash
# Optional: Custom rate limiting
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW_MS=60000

# Optional: Cache configuration
CACHE_MAX_SIZE=100
CACHE_TTL_MS=86400000
```

### Customization

#### Adding New Parsing Sources
1. Create a new parser in `src/lib/parsers/`
2. Add the parser to the parsing chain in `src/app/api/parse/route.ts`
3. Add corresponding tests in `src/test/`

#### Modifying Rate Limits
Update the configuration in `src/lib/rate-limiter.ts`:
```typescript
export const rateLimiter = new RateLimiter({
  maxRequests: 10,        // Requests per window
  windowMs: 60 * 1000,    // Window size in milliseconds
});
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run linting: `npm run lint`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended configuration
- **Testing**: Maintain >70% coverage
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Core Web Vitals optimization

## 📊 Performance

### Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### Optimizations
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based splitting
- **Caching**: 24-hour recipe caching with LRU eviction
- **Bundle Analysis**: Use `npm run analyze` to inspect bundle size

## 🐛 Troubleshooting

### Common Issues

**"No Recipe Found" Error**
- Ensure the URL points directly to a recipe page
- Try the "Print Recipe" version of the page
- Check if the site uses structured data (JSON-LD, Microdata)

**Rate Limiting**
- Wait 1 minute between requests if you hit the limit
- The limit is 10 requests per minute per IP address

**Parsing Failures**
- Some sites block automated requests
- Try copying the URL from a different browser
- Ensure the recipe is publicly accessible

### Debug Mode
Enable verbose logging by setting `NODE_ENV=development`:
```bash
NODE_ENV=development npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the excellent framework
- **Tailwind CSS** for the utility-first CSS framework
- **Cheerio** for server-side HTML manipulation
- **Recipe Schema.org** for structured data standards
- **All contributors** who help improve this project

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/recipe-extractor/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/recipe-extractor/discussions)
- **Email**: your-email@example.com

---

**Made with ❤️ for home cooks and developers**

*Extract any recipe, scale to any size, cook with confidence.*
// Theme debugging utilities
export class ThemeDebugger {
  private static instance: ThemeDebugger;
  private logs: string[] = [];
  private isEnabled = true;

  static getInstance(): ThemeDebugger {
    if (!ThemeDebugger.instance) {
      ThemeDebugger.instance = new ThemeDebugger();
    }
    return ThemeDebugger.instance;
  }

  log(message: string, data?: unknown) {
    if (!this.isEnabled) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    this.logs.push(logEntry);
    console.log(`🔍 THEME DEBUG: ${message}`, data ?? '');
    
    // Keep only last 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50);
    }
  }

  error(message: string, error?: unknown) {
    if (!this.isEnabled) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ERROR: ${message}`;
    
    this.logs.push(logEntry);
    console.error(`❌ THEME ERROR: ${message}`, error ?? '');
  }

  inspectDOM() {
    const html = document.documentElement;
    const body = document.body;
    
    this.log('=== DOM INSPECTION ===');
    this.log(`HTML classes: "${html.className}"`);
    this.log(`Body classes: "${body.className}"`);
    this.log(`HTML has 'dark' class: ${html.classList.contains('dark')}`);
    this.log(`HTML has 'light' class: ${html.classList.contains('light')}`);
    this.log(`Body computed background: ${window.getComputedStyle(body).backgroundColor}`);
    this.log(`Body computed color: ${window.getComputedStyle(body).color}`);
  }

  inspectLocalStorage() {
    this.log('=== LOCALSTORAGE INSPECTION ===');
    const theme = localStorage.getItem('theme');
    this.log(`localStorage theme: "${theme}"`);
    this.log(`localStorage keys: ${Object.keys(localStorage).join(', ')}`);
  }

  inspectThemeContext() {
    this.log('=== THEME CONTEXT INSPECTION ===');
    // This will be called from the context
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  // Test theme switching manually
  testThemeSwitch() {
    this.log('=== MANUAL THEME SWITCH TEST ===');
    
    const html = document.documentElement;
    const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    this.log(`Current theme: ${currentTheme}`);
    this.log(`Switching to: ${newTheme}`);
    
    // Remove all theme classes
    html.classList.remove('dark', 'light');
    
    // Add new theme class
    html.classList.add(newTheme);
    
    // Update localStorage
    localStorage.setItem('theme', newTheme);
    
    this.log(`Applied theme: ${newTheme}`);
    this.inspectDOM();
  }

  // Comprehensive system check
  fullSystemCheck() {
    this.log('=== FULL SYSTEM CHECK ===');
    this.inspectDOM();
    this.inspectLocalStorage();
    this.inspectThemeContext();
    
    // Check if Tailwind is loaded
    const hasTailwind = document.querySelector('style[data-tailwind]') || 
                       Array.from(document.styleSheets).some(sheet => 
                         sheet.href && sheet.href.includes('tailwind')
                       );
    this.log(`Tailwind CSS loaded: ${hasTailwind}`);
    
    // Check for any CSS conflicts
    const bodyStyles = window.getComputedStyle(document.body);
    this.log(`Body background (computed): ${bodyStyles.backgroundColor}`);
    this.log(`Body color (computed): ${bodyStyles.color}`);
    
    // Check for any JavaScript errors
    const errors = this.logs.filter(log => log.includes('ERROR'));
    this.log(`Total errors in session: ${errors.length}`);
  }
}

declare global {
  interface Window {
    themeDebugger?: ThemeDebugger;
  }
}

// Global debugger instance
export const themeDebugger = ThemeDebugger.getInstance();

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.themeDebugger = themeDebugger;
}

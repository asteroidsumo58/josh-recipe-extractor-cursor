'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { themeDebugger } from '@/lib/theme-debug';

export default function ThemeDebugPanel() {
  const { theme, toggleTheme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [domInfo, setDomInfo] = useState<any>({});

  const refreshLogs = () => {
    setLogs(themeDebugger.getLogs());
  };

  const refreshDOMInfo = () => {
    const html = document.documentElement;
    const body = document.body;
    const bodyStyles = window.getComputedStyle(body);
    
    setDomInfo({
      htmlClasses: html.className,
      bodyClasses: body.className,
      hasDarkClass: html.classList.contains('dark'),
      hasLightClass: html.classList.contains('light'),
      bodyBackground: bodyStyles.backgroundColor,
      bodyColor: bodyStyles.color,
      localStorageTheme: localStorage.getItem('theme'),
    });
  };

  useEffect(() => {
    refreshLogs();
    refreshDOMInfo();
    
    const interval = setInterval(() => {
      refreshLogs();
      refreshDOMInfo();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const runFullSystemCheck = () => {
    themeDebugger.fullSystemCheck();
    refreshLogs();
    refreshDOMInfo();
  };

  const testManualSwitch = () => {
    themeDebugger.testThemeSwitch();
    refreshLogs();
    refreshDOMInfo();
  };

  const clearLogs = () => {
    themeDebugger.clearLogs();
    refreshLogs();
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-mono z-50"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black text-white p-4 rounded-lg text-xs font-mono max-w-md max-h-96 overflow-auto z-50 border border-gray-600">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Theme Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-red-400 hover:text-red-300"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <strong>Current Theme:</strong> {theme}
        </div>
        
        <div>
          <strong>HTML Classes:</strong> {domInfo.htmlClasses || 'N/A'}
        </div>
        
        <div>
          <strong>Has Dark Class:</strong> {domInfo.hasDarkClass ? '✅' : '❌'}
        </div>
        
        <div>
          <strong>Has Light Class:</strong> {domInfo.hasLightClass ? '✅' : '❌'}
        </div>
        
        <div>
          <strong>Body Background:</strong> {domInfo.bodyBackground || 'N/A'}
        </div>
        
        <div>
          <strong>localStorage:</strong> {domInfo.localStorageTheme || 'N/A'}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={toggleTheme}
            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
          >
            Toggle Theme
          </button>
          
          <button
            onClick={testManualSwitch}
            className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
          >
            Manual Switch
          </button>
          
          <button
            onClick={runFullSystemCheck}
            className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs"
          >
            System Check
          </button>
          
          <button
            onClick={clearLogs}
            className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs"
          >
            Clear Logs
          </button>
        </div>

        <div className="mt-2">
          <strong>Recent Logs:</strong>
          <div className="max-h-32 overflow-auto bg-gray-900 p-2 rounded text-xs">
            {logs.slice(-10).map((log, i) => (
              <div key={i} className="text-gray-300">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

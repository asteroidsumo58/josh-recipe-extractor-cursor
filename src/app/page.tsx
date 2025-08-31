export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Recipe Extractor
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
          Extract and display recipes from any URL with smart parsing and kitchen-friendly features
        </p>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Coming soon: Paste any recipe URL to extract ingredients, instructions, and cooking times with automatic scaling and timer features.
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>✨ Smart ingredient parsing</p>
            <p>⏱️ Automatic timer detection</p>
            <p>📱 Mobile-friendly design</p>
            <p>🌙 Dark mode support</p>
          </div>
        </div>
      </div>
    </div>
  );
}
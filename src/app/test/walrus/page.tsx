'use client';

import WalrusTestDashboard from '@/components/WalrusTestDashboard';

export default function WalrusTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🦭 Walrus Network Test
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Test Walrus storage functionality and network connectivity
          </p>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-2">
              🟢 Publisher: {process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL}
            </span>
            <span className="mx-4">|</span>
            <span className="inline-flex items-center gap-2">
              🟢 Aggregator: {process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL}
            </span>
          </div>
        </div>
        
        <WalrusTestDashboard />
        
        {/* Network Status Checker */}
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              🔍 Network Connectivity
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-300">
                  <strong>Publisher Endpoint:</strong>
                </p>
                <code className="block bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs text-gray-900 dark:text-gray-100">
                  {process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL}
                </code>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-300">
                  <strong>Aggregator Endpoint:</strong>
                </p>
                <code className="block bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs text-gray-900 dark:text-gray-100">
                  {process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL}
                </code>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                💡 <strong>Troubleshooting:</strong> If uploads fail, check if Walrus testnet is operational or try switching endpoints.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
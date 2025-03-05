'use client';

import { useState, useRef } from 'react';

interface IpResult {
  ip: string;
  country?: string;
  method: string;
  timestamp: string;
  message?: string;
  accessReason?: string;
  allowedIps?: string[];
  allowedCountries?: string[];
  note?: string;
  id?: string;
}

export default function Home() {
  const [results, setResults] = useState<IpResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [customIp, setCustomIp] = useState<string>('');
  const [showCustomIpInput, setShowCustomIpInput] = useState<boolean>(false);
  const customIpInputRef = useRef<HTMLInputElement>(null);

  const fetchIp = async (endpoint: string, options?: { customIp?: string }) => {
    setLoading(true);
    try {
      // For the protected route, add the current IP as a testing parameter if available
      let url = `/api/${endpoint}`;
      
      // If custom IP is provided, use it for the protected route
      if (endpoint === 'protected-by-middleware' && options?.customIp) {
        url += `?allowIp=${options.customIp}`;
      }
      // Otherwise, if we have a previous result with an IP, use it for testing the protected route
      else if (endpoint === 'protected-by-middleware' && results.length > 0 && results[0].ip !== 'IP not available') {
        url += `?allowIp=${results[0].ip}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Add custom message if using custom IP
      const resultData = options?.customIp 
        ? {...data, message: `Testing protected route with custom IP: ${options.customIp}`, id: crypto.randomUUID()}
        : {...data, id: crypto.randomUUID()};
      
      setResults(prev => [resultData, ...prev]);
      
      // Clear the custom IP input after successful test
      if (options?.customIp) {
        setCustomIp('');
        setShowCustomIpInput(false);
      }
    } catch (error) {
      console.error(`Error fetching from ${endpoint}:`, error);
      setResults(prev => [{
        ip: 'Error fetching IP',
        method: endpoint,
        timestamp: new Date().toISOString(),
        message: options?.customIp ? `Failed to test with custom IP: ${options.customIp}` : undefined,
        id: crypto.randomUUID()
      }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const testProtectedWithCurrentIp = async () => {
    // First, get the IP from the direct API
    setLoading(true);
    try {
      // Get the IP first
      const ipResponse = await fetch('/api/direct-ip');
      const ipData = await ipResponse.json();
      const currentIp = ipData.ip;
      
      // Then test the protected route with this IP
      const protectedResponse = await fetch(`/api/protected-by-middleware?allowIp=${currentIp}`);
      const protectedData = await protectedResponse.json();
      
      setResults(prev => [
        {...protectedData, id: crypto.randomUUID()},
        {...ipData, id: crypto.randomUUID(), 
          message: 'This IP was used to test the protected route'
        },
        ...prev
      ]);
    } catch (error) {
      console.error('Error testing protected route with current IP:', error);
      setResults(prev => [{
        ip: 'Error testing protected route',
        method: 'test-with-current-ip',
        timestamp: new Date().toISOString(),
        id: crypto.randomUUID()
      }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const handleProtectedRouteClick = () => {
    if (showCustomIpInput && customIp.trim()) {
      // If custom IP input is shown and has a value, use it
      fetchIp('protected-by-middleware', { customIp: customIp.trim() });
    } else {
      // Otherwise toggle the custom IP input visibility
      setShowCustomIpInput(prev => !prev);
      
      // Focus the input when showing it
      if (!showCustomIpInput && customIpInputRef.current) {
        setTimeout(() => {
          if (customIpInputRef.current) {
            customIpInputRef.current.focus();
          }
        }, 100);
      }
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full max-w-4xl">
        <h1 className="text-2xl font-bold mb-2">IP Address Detection Test Cases</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Testing different methods to get the end user&apos;s IP address from Vercel functions
        </p>
      </header>
      
      <main className="flex flex-col gap-8 w-full max-w-4xl">
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => fetchIp('direct-ip')}
            className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={loading}
            type="button"
          >
            <div className="font-bold">Direct API IP Detection</div>
            <div className="text-sm mt-1 opacity-90">
              Uses <code className="bg-blue-600 px-1 rounded">@vercel/functions</code> ipAddress() in API route
            </div>
            <div className="text-xs mt-1 opacity-75">
              Location: app/api/direct-ip/route.ts
            </div>
          </button>
          
          <button
            onClick={() => fetchIp('middleware-ip')}
            className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            disabled={loading}
            type="button"
          >
            <div className="font-bold">Middleware IP Detection</div>
            <div className="text-sm mt-1 opacity-90">
              Middleware extracts IP and passes via headers to API route
            </div>
            <div className="text-xs mt-1 opacity-75">
              Location: middleware.ts → app/api/middleware-ip/route.ts
            </div>
          </button>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={handleProtectedRouteClick}
              className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              disabled={loading}
              type="button"
            >
              <div className="font-bold">Protected API Route</div>
              <div className="text-sm mt-1 opacity-90">
                Middleware provides IP-based access control before API access
              </div>
              <div className="text-xs mt-1 opacity-75">
                Location: middleware.ts → app/api/protected-by-middleware/route.ts
              </div>
              <div className="text-xs mt-1 opacity-75 italic">
                {showCustomIpInput 
                  ? "Enter a custom IP below and click this button again to test" 
                  : "Click to enter a custom IP for testing, or use your current IP"}
              </div>
            </button>
            
            {showCustomIpInput && (
              <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex flex-col sm:flex-row gap-2">
                <input
                  ref={customIpInputRef}
                  type="text"
                  value={customIp}
                  onChange={(e) => setCustomIp(e.target.value)}
                  placeholder="Enter IP address to test (e.g., 192.168.1.1)"
                  className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customIp.trim()) {
                      fetchIp('protected-by-middleware', { customIp: customIp.trim() });
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCustomIpInput(false)}
                    className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={testProtectedWithCurrentIp}
                    className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors whitespace-nowrap"
                    disabled={loading}
                    type="button"
                  >
                    Use My IP
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => fetchIp('edge-ip')}
            className="p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            disabled={loading}
            type="button"
          >
            <div className="font-bold">Edge Runtime IP Detection</div>
            <div className="text-sm mt-1 opacity-90">
              Uses Edge runtime to get IP directly from request.ip
            </div>
            <div className="text-xs mt-1 opacity-75">
              Location: app/api/edge-ip/route.ts (with runtime: &apos;edge&apos;)
            </div>
          </button>
          
          <button
            onClick={clearResults}
            className="p-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            type="button"
          >
            Clear Results
          </button>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Results:</h2>
          {loading && <p className="text-gray-500">Loading...</p>}
          
          <div className="space-y-4">
            {results.length === 0 ? (
              <p className="text-gray-500">No results yet. Click a button above to test.</p>
            ) : (
              results.map((result) => (
                <div key={result.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p><strong>IP Address:</strong> {result.ip}</p>
                  {result.country && <p><strong>Country:</strong> {result.country}</p>}
                  <p><strong>Method:</strong> {result.method}</p>
                  <p><strong>Timestamp:</strong> {result.timestamp}</p>
                  {result.message && <p><strong>Message:</strong> {result.message}</p>}
                  {result.accessReason && <p><strong>Access Granted Via:</strong> {result.accessReason}</p>}
                  
                  {result.allowedIps && (
                    <div className="mt-2 text-sm">
                      <p><strong>Allowed IPs:</strong> {result.allowedIps.join(', ')}</p>
                    </div>
                  )}
                  
                  {result.allowedCountries && (
                    <div className="text-sm">
                      <p><strong>Allowed Countries:</strong> {result.allowedCountries.join(', ')}</p>
                    </div>
                  )}
                  
                  {result.note && (
                    <div className="mt-2 text-sm italic">
                      <p>{result.note}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      
      <footer className="flex gap-6 flex-wrap items-center justify-center mt-auto">
        <p className="text-sm text-gray-500">
          IP detection methods for Vercel Functions
        </p>
      </footer>
    </div>
  );
}

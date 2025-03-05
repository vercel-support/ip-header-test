import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Get allowed IPs from environment variables or use defaults for testing
// In production, you would set these in your Vercel project settings
// Format: comma-separated list of IPs
const allowedIpsEnv = process.env.ALLOWED_IPS || '127.0.0.1,::1,IP not available';
const ALLOWED_IPS = allowedIpsEnv.split(',').map(ip => ip.trim());

// Get allowed countries from environment variables or use defaults for testing
// Format: comma-separated list of country codes
const allowedCountriesEnv = process.env.ALLOWED_COUNTRIES || 'US,CA,AU';
const ALLOWED_COUNTRIES = allowedCountriesEnv.split(',').map(country => country.trim());

// For testing: If this query parameter is present, it will be used as the allowed IP
// This allows you to test the IP restriction when deployed
// Example: /api/protected-by-middleware?allowIp=123.456.789.0
const TESTING_ALLOW_IP_PARAM = 'allowIp';

/*
 * PRODUCTION EXAMPLES (Uncomment and modify as needed):
 * 
 * 1. IP Range Checking using CIDR notation:
 * 
 * import { isIPInCIDR } from './utils/ip'; // You would need to implement this function
 * 
 * function isIpAllowed(ip: string): boolean {
 *   // Example CIDR ranges
 *   const allowedRanges = [
 *     '192.168.1.0/24',    // All IPs in the 192.168.1.x range
 *     '10.0.0.0/8',        // All IPs in the 10.x.x.x range
 *     '172.16.0.0/12',     // All IPs in the 172.16.x.x through 172.31.x.x range
 *     '2001:db8::/32'      // IPv6 example
 *   ];
 *   
 *   return allowedRanges.some(range => isIPInCIDR(ip, range));
 * }
 * 
 * 2. Region-based restrictions using Vercel's geo headers:
 * 
 * function isRegionAllowed(request: NextRequest): boolean {
 *   const country = request.geo?.country || 
 *                   request.headers.get('x-vercel-ip-country') || 
 *                   'Unknown';
 *                   
 *   const region = request.geo?.region || 
 *                  request.headers.get('x-vercel-ip-country-region') || 
 *                  'Unknown';
 *                  
 *   const city = request.geo?.city || 'Unknown';
 *   
 *   // Allow specific countries
 *   const allowedCountries = ['US', 'CA', 'GB'];
 *   if (!allowedCountries.includes(country)) return false;
 *   
 *   // For US, only allow specific states
 *   if (country === 'US') {
 *     const allowedStates = ['CA', 'NY', 'WA'];
 *     if (!allowedStates.includes(region)) return false;
 *   }
 *   
 *   // For Canada, only allow specific cities
 *   if (country === 'CA' && region === 'ON') {
 *     const allowedCities = ['Toronto', 'Ottawa'];
 *     if (!allowedCities.includes(city)) return false;
 *   }
 *   
 *   return true;
 * }
 * 
 * 3. Time-based restrictions:
 * 
 * function isTimeAllowed(): boolean {
 *   const now = new Date();
 *   const hour = now.getUTCHours();
 *   
 *   // Only allow access during business hours (9 AM - 5 PM UTC)
 *   return hour >= 9 && hour < 17;
 * }
 */

export function middleware(request: NextRequest) {
  // Get the IP address from the request
  const ip = request.ip || 'IP not available';
  
  // Get the country from the request headers (Vercel automatically adds this)
  const country = request.geo?.country || request.headers.get('x-vercel-ip-country') || 'Unknown';
  
  // Log the IP address and country
  console.log('Middleware IP detection:', ip, 'Country:', country);
  
  // Add the IP and country to the headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-user-ip', ip);
  response.headers.set('x-user-country', country);
  
  // For the protected route, check if the IP is allowed
  if (request.nextUrl.pathname.startsWith('/api/protected-by-middleware')) {
    // For testing: Check if the allowIp query parameter is present
    const allowIpParam = request.nextUrl.searchParams.get(TESTING_ALLOW_IP_PARAM);
    
    // Determine if IP is allowed (either in the allowlist or matches the test parameter)
    const isIpAllowed = ALLOWED_IPS.includes(ip) || (allowIpParam && ip === allowIpParam);
    const isCountryAllowed = ALLOWED_COUNTRIES.includes(country);
    
    // If the IP or country is not allowed, return a 403 Forbidden response
    if (!isIpAllowed && !isCountryAllowed) {
      console.log(`Access denied for IP: ${ip}, Country: ${country}`);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Access denied', 
          message: 'Your IP or country is not allowed to access this resource',
          ip,
          country,
          allowedIps: ALLOWED_IPS,
          allowedCountries: ALLOWED_COUNTRIES,
          note: `For testing, add ?${TESTING_ALLOW_IP_PARAM}=${ip} to the URL to allow your current IP`
        }),
        { 
          status: 403, 
          headers: { 'content-type': 'application/json' }
        }
      );
    }
    
    // If allowed, add additional headers for the protected route
    const accessReason = isIpAllowed 
      ? (allowIpParam && ip === allowIpParam ? 'testing-param' : 'ip-whitelist') 
      : 'country-whitelist';
    
    response.headers.set('x-access-allowed-reason', accessReason);
  }
  
  return response;
}

// Only run middleware on specific paths
export const config = {
  matcher: ['/api/middleware-ip', '/api/protected-by-middleware/:path*'],
}; 
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Get the IP address from the middleware-set header
  const ip = request.headers.get('x-user-ip') || 'IP not available';
  
  // Get the country from the middleware-set header
  const country = request.headers.get('x-user-country') || 'Unknown';
  
  // Log the IP address and country
  console.log('API with middleware IP detection:', ip, 'Country:', country);
  
  // Return the IP address and country
  return NextResponse.json({ 
    ip,
    country,
    method: 'API with middleware header',
    timestamp: new Date().toISOString()
  });
} 
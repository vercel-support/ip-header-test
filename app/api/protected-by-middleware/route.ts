import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Get the IP address from the middleware-set header
  const ip = request.headers.get('x-user-ip') || 'IP not available';
  
  // Get the country from the middleware-set header
  const country = request.headers.get('x-user-country') || 'Unknown';
  
  // Get the access allowed reason from the middleware-set header
  const accessReason = request.headers.get('x-access-allowed-reason') || 'unknown';
  
  // Log the IP address
  console.log('Protected API IP detection:', ip, 'Country:', country, 'Access reason:', accessReason);
  
  // Return the IP address
  return NextResponse.json({ 
    ip,
    country,
    method: 'Protected API route with middleware IP check',
    timestamp: new Date().toISOString(),
    message: `This route is protected by middleware IP checks. Access granted via: ${accessReason}`,
    accessReason
  });
} 
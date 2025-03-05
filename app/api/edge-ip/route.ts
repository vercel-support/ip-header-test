import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // Get the IP address directly from the request in Edge runtime
  const ip = request.ip || 'IP not available';
  
  // Log the IP address
  console.log('Edge API IP detection:', ip);
  
  // Return the IP address
  return NextResponse.json({ 
    ip,
    method: 'Edge API runtime',
    timestamp: new Date().toISOString()
  });
} 
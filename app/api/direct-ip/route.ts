import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ipAddress } from '@vercel/functions';

export async function GET(request: NextRequest) {
  // Get the IP address using @vercel/functions
  const ip = ipAddress(request) || 'IP not available';
  
  // Log the IP address
  console.log('Direct API IP detection:', ip);
  
  // Return the IP address
  return NextResponse.json({ 
    ip,
    method: 'Direct API call using @vercel/functions',
    timestamp: new Date().toISOString()
  });
} 
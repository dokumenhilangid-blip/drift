import { NextResponse } from 'next/server';

// Cloud Run health check endpoint.
// Returns 200 OK with minimal payload — used for readiness/liveness probes.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'drift',
      timestamp: new Date().toISOString(),
      gemini_configured: Boolean(process.env.GEMINI_API_KEY),
    },
    { status: 200 }
  );
}

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    message: 'API Emma-Shop en ligne (Next.js Route Handlers).',
  });
}

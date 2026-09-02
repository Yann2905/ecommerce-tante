import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logEvent } from '@/lib/observability';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    const { error } = await supabaseAdmin.from('products').select('id').limit(1);
    if (error) throw error;
    return NextResponse.json({ status: 'ok', database: 'ok', checkedAt });
  } catch (error) {
    logEvent('error', 'healthcheck.failed', { message: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ status: 'degraded', database: 'error', checkedAt }, { status: 503 });
  }
}

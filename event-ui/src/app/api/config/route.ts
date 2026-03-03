import { NextResponse } from 'next/server';
import { createClient } from '@backend/lib/supabase/server';
import { ConfigRepository } from '@backend/repositories/ConfigRepository';

/**
 * GET /api/config
 * Returns all app configuration values as a key→value JSON object.
 * Public — no authentication required.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const configRepo = new ConfigRepository(supabase);
    const config = await configRepo.getAllConfig();
    return NextResponse.json(config, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err: any) {
    console.error('GET /api/config error:', err);
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 });
  }
}

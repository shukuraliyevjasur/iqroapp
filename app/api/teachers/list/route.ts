import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const db = createServerClient();
  const { data: teachers } = await db.from('teachers').select('id, full_name').order('full_name');
  return NextResponse.json({ teachers: teachers ?? [] });
}

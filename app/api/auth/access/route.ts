import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const { code, role } = await req.json() as { code: string; role: 'parent' | 'student' };

  if (!code || !['parent', 'student'].includes(role)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const db = createServerClient();
  const normalizedCode = code.toUpperCase().trim();
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const [{ count: ipCount }, { count: codeCount }] = await Promise.all([
    db.from('login_attempts').select('*', { count: 'exact', head: true })
      .eq('ip', ip).eq('role', role).gte('failed_at', windowStart),
    db.from('login_attempts').select('*', { count: 'exact', head: true })
      .eq('access_code', normalizedCode).eq('role', role).gte('failed_at', windowStart),
  ]);

  if ((ipCount ?? 0) >= MAX_ATTEMPTS || (codeCount ?? 0) >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${WINDOW_MINUTES} minutes.` },
      { status: 429 },
    );
  }

  const table = role === 'parent' ? 'parents' : 'students';
  const { data, error } = await db
    .from(table)
    .select('id, full_name')
    .eq('access_code', normalizedCode)
    .single();

  if (error || !data) {
    await db.from('login_attempts').insert({ ip, role, access_code: normalizedCode });
    return NextResponse.json({ error: 'Access code not found.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, name: data.full_name });
  res.cookies.set(`${role}_session`, JSON.stringify({ id: data.id, name: data.full_name }), {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}

export async function DELETE(req: NextRequest) {
  const { role } = await req.json() as { role: 'parent' | 'student' };
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(`${role}_session`);
  return res;
}

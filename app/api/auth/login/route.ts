import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const { pin } = await req.json();

  const db = createServerClient();

  // Check failed attempts in the last 15 min
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count } = await db
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .eq('role', 'admin')
    .gte('failed_at', windowStart);

  if ((count ?? 0) >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${WINDOW_MINUTES} minutes.` },
      { status: 429 },
    );
  }

  if (pin !== process.env.ADMIN_PIN) {
    await db.from('login_attempts').insert({ ip, role: 'admin' });
    const remaining = MAX_ATTEMPTS - ((count ?? 0) + 1);
    return NextResponse.json(
      { error: `Wrong PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} left.` },
      { status: 401 },
    );
  }

  // Correct PIN — clear attempts and set cookie
  await db.from('login_attempts').delete().eq('ip', ip).eq('role', 'admin');

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', process.env.AUTH_COOKIE_SECRET!, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('admin_session');
  return res;
}

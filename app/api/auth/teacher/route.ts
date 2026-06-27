import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const { pin, teacherId } = await req.json() as { pin: string; teacherId: string };

  if (!pin || !teacherId) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const db = createServerClient();
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count } = await db
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .eq('role', 'teacher')
    .gte('failed_at', windowStart);

  if ((count ?? 0) >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${WINDOW_MINUTES} minutes.` },
      { status: 429 },
    );
  }

  const { data: teacher, error } = await db
    .from('teachers')
    .select('id, full_name, pin_hash')
    .eq('id', teacherId)
    .single();

  if (error || !teacher) {
    await db.from('login_attempts').insert({ ip, role: 'teacher' });
    return NextResponse.json({ error: 'Teacher not found.' }, { status: 401 });
  }

  const valid = await bcrypt.compare(pin, teacher.pin_hash);
  if (!valid) {
    await db.from('login_attempts').insert({ ip, role: 'teacher' });
    const remaining = MAX_ATTEMPTS - ((count ?? 0) + 1);
    return NextResponse.json(
      { error: `Wrong PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} left.` },
      { status: 401 },
    );
  }

  await db.from('login_attempts').delete().eq('ip', ip).eq('role', 'teacher');

  const res = NextResponse.json({ ok: true, name: teacher.full_name });
  res.cookies.set('teacher_session', JSON.stringify({ id: teacher.id, name: teacher.full_name }), {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 12,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('teacher_session');
  return res;
}

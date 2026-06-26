import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { code, role } = await req.json() as { code: string; role: 'parent' | 'student' };

  if (!code || !['parent', 'student'].includes(role)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const db = createServerClient();
  const table = role === 'parent' ? 'parents' : 'students';

  const { data, error } = await db
    .from(table)
    .select('id, full_name')
    .eq('access_code', code.toUpperCase().trim())
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Access code not found.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, name: data.full_name });
  res.cookies.set(`${role}_session`, JSON.stringify({ id: data.id, name: data.full_name }), {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
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

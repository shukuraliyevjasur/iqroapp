export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getParentSession } from '@/lib/session';
import { validateSession } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { AttendanceList } from './AttendanceList';

export default async function OtaOnaDavomatPage() {
  const db = createServerClient();
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const session = await validateSession(await getParentSession(), db, ip, 'parents', 'parent');
  if (!session) redirect('/kirish?role=parent');

  const { data: parent } = await db.from('parents').select('student_id').eq('id', session.id).single();
  if (!parent?.student_id) redirect('/ota-ona/bosh');

  const { data: attendance } = await db
    .from('attendance')
    .select('date, status')
    .eq('student_id', parent.student_id)
    .order('date', { ascending: false })
    .limit(60);

  return <AttendanceList attendance={attendance ?? []} />;
}

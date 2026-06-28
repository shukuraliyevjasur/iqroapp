export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getStudentSession } from '@/lib/session';
import { validateSession } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { AttendanceList } from '@/app/ota-ona/davomat/AttendanceList';

export default async function TalabaDavomatPage() {
  const db = createServerClient();
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const session = await validateSession(await getStudentSession(), db, ip, 'students', 'student');
  if (!session) redirect('/kirish?role=student');

  const { data: attendance } = await db
    .from('attendance')
    .select('date, status')
    .eq('student_id', session.id)
    .order('date', { ascending: false })
    .limit(60);

  return <AttendanceList attendance={attendance ?? []} />;
}

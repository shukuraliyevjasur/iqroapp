export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getStudentSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase/server';
import { AttendanceList } from '@/app/ota-ona/davomat/AttendanceList';

export default async function TalabaDavomatPage() {
  const session = await getStudentSession();
  if (!session) redirect('/kirish?role=student');

  const db = createServerClient();
  const { data: attendance } = await db
    .from('attendance')
    .select('date, status')
    .eq('student_id', session.id)
    .order('date', { ascending: false })
    .limit(60);

  return <AttendanceList attendance={attendance ?? []} />;
}

export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getParentSession } from '@/lib/session';
import { validateSession } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { ParentDashboard } from './ParentDashboard';

export default async function OtaOnaBoshPage() {
  const db = createServerClient();
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const session = await validateSession(await getParentSession(), db, ip, 'parents', 'parent');
  if (!session) redirect('/kirish?role=parent');

  const { data: parent } = await db
    .from('parents')
    .select('id, full_name, student_id, students(id, full_name, access_code, group_id, groups(name, schedule_days, schedule_time, teacher_name))')
    .eq('id', session.id)
    .single();

  if (!parent) redirect('/kirish?role=parent');

  const student = (parent as any).students;
  const group = student?.groups ?? null;

  // Get recent attendance (last 10)
  const { data: attendance } = student ? await db
    .from('attendance')
    .select('date, status')
    .eq('student_id', student.id)
    .order('date', { ascending: false })
    .limit(10) : { data: [] };

  // Get payment summary
  const { data: payments } = student ? await db
    .from('payments')
    .select('month_label, amount_uzs, status')
    .eq('student_id', student.id)
    .order('due_date', { ascending: false })
    .limit(5) : { data: [] };

  return (
    <ParentDashboard
      parentName={parent.full_name}
      student={student}
      group={group}
      recentAttendance={attendance ?? []}
      recentPayments={payments ?? []}
    />
  );
}

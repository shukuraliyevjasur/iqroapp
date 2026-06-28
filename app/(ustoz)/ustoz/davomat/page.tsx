export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getTeacherSession } from '@/lib/session';
import { validateSession } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { TeacherDavomatClient } from './TeacherDavomatClient';

export default async function UstozDavomatPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; date?: string }>;
}) {
  const db = createServerClient();
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const session = await validateSession(await getTeacherSession(), db, ip, 'teachers', 'teacher');
  if (!session) redirect('/kirish?role=teacher');

  const params = await searchParams;

  // Only show groups assigned to this teacher
  const { data: teacherGroups } = await db
    .from('teacher_groups')
    .select('group_id, groups(id, name)')
    .eq('teacher_id', session.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groups = ((teacherGroups ?? []).map(tg => tg.groups).flat().filter(Boolean)) as { id: number; name: string }[];
  const selectedGroupId = params.group ? Number(params.group) : (groups[0]?.id ?? null);
  const selectedDate = params.date ?? new Date().toISOString().split('T')[0];

  let students: { id: number; full_name: string }[] = [];
  let existingAttendance: Record<number, string> = {};
  let lessonTopic: { title: string; material_link: string | null } | null = null;

  if (selectedGroupId) {
    // Double-check teacher is assigned to this specific group
    const assigned = groups.some(g => g.id === selectedGroupId);
    if (assigned) {
      const [{ data: groupStudents }, { data: attRows }, { data: lesson }] = await Promise.all([
        db.from('students').select('id, full_name').eq('group_id', selectedGroupId).eq('status', 'active').order('full_name'),
        db.from('attendance').select('student_id, status').eq('group_id', selectedGroupId).eq('date', selectedDate),
        db.from('lessons').select('title, material_link').eq('group_id', selectedGroupId).eq('lesson_date', selectedDate).maybeSingle(),
      ]);
      students = groupStudents ?? [];
      for (const r of attRows ?? []) existingAttendance[r.student_id] = r.status;
      lessonTopic = lesson ?? null;
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">IQRO</p>
        <h1 className="text-2xl font-bold text-[#1C1C2E]">Davomat belgilash</h1>
      </div>
      <TeacherDavomatClient
        groups={groups} selectedGroupId={selectedGroupId} selectedDate={selectedDate}
        students={students} existingAttendance={existingAttendance} lessonTopic={lessonTopic}
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase/server';
import { DavomatClient } from './DavomatClient';

export default async function DavomatPage({ searchParams }: { searchParams: Promise<{ group?: string; date?: string }> }) {
  const params = await searchParams;
  const db = createServerClient();

  const { data: groups } = await db.from('groups').select('id, name').eq('status', 'active').order('name');
  const selectedGroupId = params.group ? Number(params.group) : (groups?.[0]?.id ?? null);
  const selectedDate = params.date ?? new Date().toISOString().split('T')[0];

  let students: { id: number; full_name: string }[] = [];
  let existingAttendance: Record<number, string> = {};
  let lessonTopic: { title: string; material_link: string | null } | null = null;

  if (selectedGroupId) {
    const [{ data: groupStudents }, { data: attendanceRows }, { data: lesson }] = await Promise.all([
      db.from('students').select('id, full_name').eq('group_id', selectedGroupId).eq('status', 'active').order('full_name'),
      db.from('attendance').select('student_id, status').eq('group_id', selectedGroupId).eq('date', selectedDate),
      db.from('lessons').select('title, material_link').eq('group_id', selectedGroupId).eq('lesson_date', selectedDate).maybeSingle(),
    ]);
    students = groupStudents ?? [];
    for (const row of attendanceRows ?? []) existingAttendance[row.student_id] = row.status;
    lessonTopic = lesson ?? null;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">IQRO</p>
        <h1 className="text-2xl font-bold text-[#1C1C2E]">Davomat</h1>
      </div>
      <DavomatClient
        groups={groups ?? []}
        selectedGroupId={selectedGroupId}
        selectedDate={selectedDate}
        students={students}
        existingAttendance={existingAttendance}
        lessonTopic={lessonTopic}
      />
    </div>
  );
}

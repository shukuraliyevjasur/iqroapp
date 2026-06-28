export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase/server';
import { GuruhlarClient } from './GuruhlarClient';

export default async function GuruhlarPage() {
  const db = createServerClient();
  const [{ data: rawGroups }, { data: students }] = await Promise.all([
    db.from('groups')
      .select('id, name, schedule_days, schedule_time, max_students, status, teacher_groups(teachers(full_name))')
      .order('name'),
    db.from('students').select('id, full_name, group_id').eq('status', 'active').order('full_name'),
  ]);

  // Derive teacher_name live from the join instead of the cached column
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groups = (rawGroups ?? []).map((g: any) => ({
    id: g.id as number,
    name: g.name as string,
    schedule_days: g.schedule_days as string[],
    schedule_time: g.schedule_time as string | null,
    max_students: g.max_students as number,
    status: g.status as string,
    teacher_name: (g.teacher_groups as { teachers: { full_name: string } | null }[])[0]?.teachers?.full_name ?? null,
  }));

  const studentCounts: Record<number, number> = {};
  for (const s of students ?? []) {
    if (s.group_id) studentCounts[s.group_id] = (studentCounts[s.group_id] ?? 0) + 1;
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">IQRO</p>
          <h1 className="text-2xl font-bold text-[#1C1C2E]">Guruhlar</h1>
        </div>
      </div>
      <GuruhlarClient groups={groups} students={students ?? []} studentCounts={studentCounts} />
    </div>
  );
}

export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase/server';
import { OquvchilarClient } from './OquvchilarClient';

export default async function OquvchilarPage() {
  const db = createServerClient();
  const [studentsRes, groupsRes] = await Promise.all([
    db.from('students')
      .select('id, full_name, access_code, status, enrolled_at, group_id, groups(name)')
      .order('full_name'),
    db.from('groups').select('id, name').eq('status', 'active').order('name'),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const students = (studentsRes.data ?? []) as any[];
  const groups = groupsRes.data ?? [];

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">IQRO</p>
          <h1 className="text-2xl font-bold text-[#1C1C2E]">O&apos;quvchilar</h1>
        </div>
      </div>
      <OquvchilarClient students={students} groups={groups} />
    </div>
  );
}

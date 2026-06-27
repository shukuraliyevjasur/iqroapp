export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getTeacherSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function UstozSahifaPage() {
  const session = await getTeacherSession();
  if (!session) redirect('/kirish?role=teacher');

  const db = createServerClient();
  const { data: teacherGroups } = await db
    .from('teacher_groups')
    .select('group_id, groups(id, name, schedule_days, schedule_time)')
    .eq('teacher_id', session.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groups = ((teacherGroups ?? []).map(tg => tg.groups).flat().filter(Boolean)) as any[];
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">IQRO</p>
        <h1 className="text-2xl font-bold text-[#1C1C2E]">Salom, {session.name}</h1>
        <p className="text-sm text-gray-400 mt-1">O&apos;qituvchi paneli</p>
      </div>

      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Mening guruhlarim</p>
      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">
          Sizga hali guruh biriktirilmagan. Admin bilan bog&apos;laning.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((g: any) => (
            <Link key={g.id} href={`/ustoz/davomat?group=${g.id}&date=${today}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 hover:shadow-md transition-all group">
              <p className="font-bold text-[#1C1C2E] group-hover:text-[#C0181B] transition-colors">{g.name}</p>
              <p className="text-xs text-gray-400 mt-1">
                {g.schedule_days?.join(', ') || '—'} {g.schedule_time ? `· ${g.schedule_time}` : ''}
              </p>
              <p className="text-xs text-[#C0181B] mt-3 font-medium">Bugungi davomat belgilash &rarr;</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

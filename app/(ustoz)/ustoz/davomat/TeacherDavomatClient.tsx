'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { submitTeacherAttendance, saveTeacherLessonTopic } from './actions';

type Group = { id: number; name: string };
type Student = { id: number; full_name: string };

export function TeacherDavomatClient({
  groups, selectedGroupId, selectedDate, students, existingAttendance, lessonTopic,
}: {
  groups: Group[]; selectedGroupId: number | null; selectedDate: string;
  students: Student[]; existingAttendance: Record<number, string>;
  lessonTopic: { title: string; material_link: string | null } | null;
}) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (const s of students) init[s.id] = existingAttendance[s.id] ?? 'present';
    return init;
  });
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function navigate(group?: number, date?: string) {
    router.push(`/ustoz/davomat?group=${group ?? selectedGroupId}&date=${date ?? selectedDate}`);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await submitTeacherAttendance(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleTopicSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => { await saveTeacherLessonTopic(fd); });
  }

  const presentCount = Object.values(statuses).filter(s => s === 'present').length;
  const absentCount = Object.values(statuses).filter(s => s === 'absent').length;

  return (
    <div className="space-y-5">
      <div className="flex gap-3 flex-wrap">
        <select value={selectedGroupId ?? ''} onChange={e => navigate(Number(e.target.value))}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]">
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <input type="date" value={selectedDate} onChange={e => navigate(undefined, e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]" />
        {students.length > 0 && (
          <div className="flex gap-2 items-center ml-auto">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg font-medium">{presentCount} keldi</span>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg font-medium">{absentCount} kelmadi</span>
          </div>
        )}
      </div>

      {!selectedGroupId ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">Guruh tanlang</div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">Bu guruhda o&apos;quvchilar yo&apos;q</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="group_id" value={selectedGroupId} />
          <input type="hidden" name="date" value={selectedDate} />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            {students.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-4 px-5 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                <input type="hidden" name={`status_${s.id}`} value={statuses[s.id] ?? 'present'} />
                <span className="flex-1 text-sm font-medium text-[#1C1C2E]">{s.full_name}</span>
                <div className="flex gap-2">
                  {(['present', 'absent', 'late'] as const).map(st => (
                    <button key={st} type="button" onClick={() => setStatuses(prev => ({ ...prev, [s.id]: st }))}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        statuses[s.id] === st
                          ? st === 'present' ? 'bg-green-500 text-white' : st === 'absent' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}>
                      {st === 'present' ? 'Keldi' : st === 'absent' ? 'Kelmadi' : 'Kech'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button type="submit" disabled={isPending}
            className="px-6 py-2.5 rounded-xl bg-[#C0181B] text-white text-sm font-semibold hover:bg-[#a01418] transition-colors disabled:opacity-50">
            {isPending ? 'Saqlanmoqda...' : saved ? 'Saqlandi!' : 'Davomatni saqlash'}
          </button>
        </form>
      )}

      {selectedGroupId && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Dars mavzusi</p>
          <form onSubmit={handleTopicSubmit} className="space-y-3">
            <input type="hidden" name="group_id" value={selectedGroupId} />
            <input type="hidden" name="date" value={selectedDate} />
            <input name="topic" defaultValue={lessonTopic?.title ?? ''} placeholder="Bugungi dars mavzusi..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]" />
            <input name="material_link" defaultValue={lessonTopic?.material_link ?? ''} placeholder="Material linki (ixtiyoriy)"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]" />
            <button type="submit" disabled={isPending}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50">
              {isPending ? 'Saqlanmoqda...' : 'Mavzuni saqlash'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

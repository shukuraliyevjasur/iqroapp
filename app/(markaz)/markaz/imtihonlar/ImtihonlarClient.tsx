'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createExam, deleteExam, saveExamResults } from './actions';

type Group = { id: number; name: string };
type Exam = { id: number; title: string; exam_date: string; max_score: number; group_id: number; groups: { name: string } | null };
type Student = { id: number; full_name: string };

export function ImtihonlarClient({
  exams, groups, selectedExamId, selectedExam, examStudents, examResults,
}: {
  exams: Exam[]; groups: Group[];
  selectedExamId: number | null; selectedExam: Exam | null;
  examStudents: Student[]; examResults: Record<number, { score: number | null; notes: string | null }>;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => { await createExam(fd); setShowAdd(false); });
  }

  function handleDelete(id: number) {
    if (!confirm("Imtihonni o'chirishni tasdiqlaysizmi?")) return;
    startTransition(async () => { await deleteExam(id); });
  }

  function handleResults(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => { await saveExamResults(fd); });
  }

  return (
    <div className="flex gap-6">
      {/* Left: exam list */}
      <div className="w-72 flex-shrink-0">
        <button onClick={() => setShowAdd(true)}
          className="w-full mb-4 px-4 py-2.5 rounded-xl bg-[#C0181B] text-white text-sm font-semibold hover:bg-[#a01418] transition-colors">
          + Imtihon qo&apos;shish
        </button>
        <div className="space-y-2">
          {exams.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">Imtihonlar yo&apos;q</p>
          ) : exams.map(ex => (
            <div key={ex.id}
              className={`p-4 rounded-2xl border cursor-pointer transition-colors ${
                selectedExamId === ex.id ? 'border-[#C0181B] bg-red-50' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
              onClick={() => router.push(`/markaz/imtihonlar?exam=${ex.id}`)}>
              <p className="font-semibold text-sm text-[#1C1C2E]">{ex.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{ex.groups?.name} · {ex.exam_date}</p>
              <p className="text-xs text-gray-400">Max: {ex.max_score} ball</p>
              <button onClick={ev => { ev.stopPropagation(); handleDelete(ex.id); }}
                className="mt-2 text-xs text-gray-300 hover:text-red-500 transition-colors">O&apos;chirish</button>
            </div>
          ))}
        </div>
      </div>

      {/* Right: results entry */}
      <div className="flex-1">
        {!selectedExam ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">
            Imtihon tanlang
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-[#1C1C2E]">{selectedExam.title}</h2>
              <p className="text-sm text-gray-400">{selectedExam.groups?.name} · {selectedExam.exam_date} · Max: {selectedExam.max_score} ball</p>
            </div>
            {examStudents.length === 0 ? (
              <p className="text-gray-400 text-sm">Bu guruhda o&apos;quvchilar yo&apos;q</p>
            ) : (
              <form onSubmit={handleResults}>
                <input type="hidden" name="exam_id" value={selectedExam.id} />
                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">O&apos;quvchi</th>
                      <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest w-24">Ball</th>
                      <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Izoh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examStudents.map(s => (
                      <tr key={s.id} className="border-b border-gray-50">
                        <td className="py-2 pr-4 font-medium text-[#1C1C2E]">{s.full_name}</td>
                        <td className="py-2 pr-4">
                          <input type="number" name={`score_${s.id}`} defaultValue={examResults[s.id]?.score ?? ''}
                            min={0} max={selectedExam.max_score} placeholder="—"
                            className="w-20 px-2 py-1 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]" />
                        </td>
                        <td className="py-2">
                          <input name={`note_${s.id}`} defaultValue={examResults[s.id]?.notes ?? ''}
                            className="w-full px-2 py-1 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="submit" disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-[#C0181B] text-white text-sm font-semibold hover:bg-[#a01418] transition-colors disabled:opacity-50">
                  {isPending ? 'Saqlanmoqda...' : 'Natijalarni saqlash'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-[#1C1C2E]">Yangi imtihon</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Guruh</label>
                <select name="group_id" required className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]">
                  <option value="">Tanlang...</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Imtihon nomi</label>
                <input name="title" required className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Sana</label>
                <input name="exam_date" type="date" required className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Max ball</label>
                <input name="max_score" type="number" defaultValue="100" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]" />
              </div>
              <button type="submit" disabled={isPending}
                className="w-full py-2.5 rounded-xl bg-[#C0181B] text-white text-sm font-semibold hover:bg-[#a01418] transition-colors disabled:opacity-50">
                {isPending ? 'Saqlanmoqda...' : 'Yaratish'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

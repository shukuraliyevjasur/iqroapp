'use client';
import { useState, useTransition } from 'react';
import { createTeacher, updateTeacher, deleteTeacher, updateTeacherGroups, resetTeacherPin, createLessonCoverage, deleteLessonCoverage } from './actions';

type Teacher = { id: number; full_name: string; created_at: string };
type Group = { id: number; name: string };
type Assignment = { teacher_id: number; group_id: number };
type Coverage = { id: number; group_id: number; teacher_id: number; date: string };

export function OqituvchilarClient({
  teachers, groups, assignments, coverage,
}: {
  teachers: Teacher[];
  groups: Group[];
  assignments: Assignment[];
  coverage: Coverage[];
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [showCoverage, setShowCoverage] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [assignTeacher, setAssignTeacher] = useState<Teacher | null>(null);
  const [newPin, setNewPin] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const groupMap = Object.fromEntries(groups.map(g => [g.id, g.name]));
  const teacherMap = Object.fromEntries(teachers.map(t => [t.id, t.full_name]));

  function getTeacherGroups(teacherId: number): number[] {
    return assignments.filter(a => a.teacher_id === teacherId).map(a => a.group_id);
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createTeacher(fd);
      setShowAdd(false);
      setNewPin(result.pin);
    });
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editTeacher) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateTeacher(editTeacher.id, fd);
      setEditTeacher(null);
    });
  }

  function handleResetPin(id: number, name: string) {
    if (!confirm(`${name} uchun PIN yangilansinmi?`)) return;
    startTransition(async () => {
      const result = await resetTeacherPin(id);
      setNewPin(result.pin);
    });
  }

  function handleDelete(id: number) {
    if (!confirm("O'qituvchini o'chirishni tasdiqlaysizmi?")) return;
    startTransition(async () => { await deleteTeacher(id); });
  }

  function handleAssign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!assignTeacher) return;
    const fd = new FormData(e.currentTarget);
    const groupIds = fd.getAll('group_ids').map(Number);
    startTransition(async () => {
      await updateTeacherGroups(assignTeacher.id, groupIds);
      setAssignTeacher(null);
    });
  }

  function handleCreateCoverage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const groupId = Number(fd.get('group_id'));
    const teacherId = Number(fd.get('teacher_id'));
    const date = fd.get('date') as string;
    startTransition(async () => {
      await createLessonCoverage(groupId, teacherId, date);
      setShowCoverage(false);
    });
  }

  function handleDeleteCoverage(id: number) {
    startTransition(async () => { await deleteLessonCoverage(id); });
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <div className="mb-5 flex gap-3">
        <button
          onClick={() => setShowAdd(true)}
          className="px-5 py-2 rounded-xl bg-[#C0181B] text-white text-sm font-semibold hover:bg-[#a01418] transition-colors"
        >
          + O&apos;qituvchi qo&apos;shish
        </button>
        <button
          onClick={() => setShowCoverage(true)}
          className="px-5 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
        >
          + O&apos;rinbosar tayinlash
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {teachers.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">O&apos;qituvchilar yo&apos;q</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Ism", "Guruhlar", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => {
                const tGroupIds = getTeacherGroups(t.id);
                return (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-[#1C1C2E]">{t.full_name}</td>
                    <td className="px-5 py-3">
                      {tGroupIds.length === 0 ? (
                        <span className="text-gray-400 text-xs">Guruh yo&apos;q</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {tGroupIds.map(gid => (
                            <span key={gid} className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {groupMap[gid] ?? `#${gid}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-3 justify-end">
                        <button onClick={() => setAssignTeacher(t)} className="text-xs text-blue-500 hover:text-blue-700 transition-colors">Guruhlar</button>
                        <button onClick={() => setEditTeacher(t)} className="text-xs text-gray-400 hover:text-[#C0181B] transition-colors">Tahrirlash</button>
                        <button onClick={() => handleResetPin(t.id, t.full_name)} className="text-xs text-gray-400 hover:text-amber-600 transition-colors">PIN yangilash</button>
                        <button onClick={() => handleDelete(t.id)} className="text-xs text-gray-400 hover:text-red-600 transition-colors">O&apos;chirish</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Coverage list */}
      {coverage.length > 0 && (
        <div className="mt-8">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">O&apos;rinbosarlar</p>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Sana", "Guruh", "O'rinbosar", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coverage.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-sm text-[#1C1C2E]">
                      {c.date}
                      {c.date === today && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-semibold">bugun</span>}
                    </td>
                    <td className="px-5 py-3 text-[#1C1C2E]">{groupMap[c.group_id] ?? `#${c.group_id}`}</td>
                    <td className="px-5 py-3 text-[#1C1C2E]">{teacherMap[c.teacher_id] ?? `#${c.teacher_id}`}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDeleteCoverage(c.id)}
                        disabled={isPending}
                        className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                      >
                        O&apos;chirish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add teacher modal */}
      {showAdd && (
        <Modal title="Yangi o'qituvchi" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To&apos;liq ism</label>
              <input
                name="full_name" required autoFocus
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]"
              />
            </div>
            <p className="text-xs text-gray-400">PIN avtomatik yaratiladi va bir marta ko&apos;rsatiladi.</p>
            <SubmitBtn pending={isPending} label="Saqlash" />
          </form>
        </Modal>
      )}

      {/* Coverage assignment modal */}
      {showCoverage && (
        <Modal title="O'rinbosar tayinlash" onClose={() => setShowCoverage(false)}>
          <form onSubmit={handleCreateCoverage} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Guruh</label>
              <select name="group_id" required className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]">
                <option value="">— tanlang —</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">O&apos;rinbosar o&apos;qituvchi</label>
              <select name="teacher_id" required className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]">
                <option value="">— tanlang —</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sana</label>
              <input
                type="date" name="date" required defaultValue={today}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]"
              />
            </div>
            <SubmitBtn pending={isPending} label="Tayinlash" />
          </form>
        </Modal>
      )}

      {/* PIN display modal */}
      {newPin && (
        <Modal title="O'qituvchi PIN" onClose={() => setNewPin(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">PIN yaratildi. Uni hozir yozib oling — qayta ko&apos;rsatilmaydi.</p>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-mono font-bold tracking-widest text-[#1C1C2E]">{newPin}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(newPin); }}
              className="w-full py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Nusxa olish
            </button>
            <button
              onClick={() => setNewPin(null)}
              className="w-full py-2.5 rounded-xl bg-[#C0181B] text-white text-sm font-semibold hover:bg-[#a01418] transition-colors"
            >
              Tushundim
            </button>
          </div>
        </Modal>
      )}

      {/* Edit modal */}
      {editTeacher && (
        <Modal title="O'qituvchini tahrirlash" onClose={() => setEditTeacher(null)}>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To&apos;liq ism</label>
              <input
                name="full_name" defaultValue={editTeacher.full_name} required autoFocus
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]"
              />
            </div>
            <SubmitBtn pending={isPending} label="Saqlash" />
          </form>
        </Modal>
      )}

      {/* Group assignment modal */}
      {assignTeacher && (
        <Modal title={`${assignTeacher.full_name} — guruhlar`} onClose={() => setAssignTeacher(null)}>
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="space-y-2">
              {groups.length === 0 ? (
                <p className="text-sm text-gray-400">Faol guruhlar yo&apos;q</p>
              ) : groups.map(g => {
                const checked = getTeacherGroups(assignTeacher.id).includes(g.id);
                return (
                  <label key={g.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="group_ids"
                      value={g.id}
                      defaultChecked={checked}
                      className="w-4 h-4 rounded accent-[#C0181B]"
                    />
                    <span className="text-sm text-[#1C1C2E]">{g.name}</span>
                  </label>
                );
              })}
            </div>
            <SubmitBtn pending={isPending} label="Saqlash" />
          </form>
        </Modal>
      )}
    </>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[#1C1C2E]">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SubmitBtn({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button type="submit" disabled={pending}
      className="w-full py-2.5 rounded-xl bg-[#C0181B] text-white text-sm font-semibold hover:bg-[#a01418] transition-colors disabled:opacity-50">
      {pending ? 'Saqlanmoqda...' : label}
    </button>
  );
}

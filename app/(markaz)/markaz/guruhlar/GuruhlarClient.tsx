'use client';
import { useState, useTransition } from 'react';
import { createGroup, updateGroup, deleteGroup, moveStudentToGroup } from './actions';

type Group = {
  id: number; name: string; teacher_name: string | null;
  schedule_days: string[]; schedule_time: string | null;
  max_students: number; status: string;
};
type Student = { id: number; full_name: string; group_id: number | null };

export function GuruhlarClient({
  groups, students, studentCounts,
}: {
  groups: Group[]; students: Student[]; studentCounts: Record<number, number>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [moveStudent, setMoveStudent] = useState<Student | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => { await createGroup(fd); setShowAdd(false); });
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editGroup) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => { await updateGroup(editGroup.id, fd); setEditGroup(null); });
  }

  function handleDelete(id: number) {
    if (!confirm("Guruhni o'chirishni tasdiqlaysizmi?")) return;
    startTransition(async () => { await deleteGroup(id); });
  }

  function handleMove(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!moveStudent) return;
    const fd = new FormData(e.currentTarget);
    const groupId = fd.get('group_id') ? Number(fd.get('group_id')) : null;
    startTransition(async () => { await moveStudentToGroup(moveStudent.id, groupId); setMoveStudent(null); });
  }

  return (
    <>
      <div className="flex gap-3 mb-5">
        <button
          onClick={() => setShowAdd(true)}
          className="px-5 py-2 rounded-xl bg-[#C0181B] text-white text-sm font-semibold hover:bg-[#a01418] transition-colors"
        >
          + Guruh qo&apos;shish
        </button>
        <select
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]"
          onChange={e => {
            const id = Number(e.target.value);
            if (!id) return;
            const s = students.find(st => st.id === id);
            if (s) setMoveStudent(s);
            e.target.value = '';
          }}
        >
          <option value="">O&apos;quvchini guruhga ko&apos;chirish...</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.length === 0 ? (
          <div className="col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">
            Guruhlar yo&apos;q
          </div>
        ) : groups.map(g => (
          <div key={g.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-[#1C1C2E]">{g.name}</p>
                <p className={`text-xs mt-0.5 ${g.teacher_name ? 'text-gray-400' : 'text-amber-500 font-medium'}`}>
                  {g.teacher_name ?? 'Tayinlanmagan'}
                </p>
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                g.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {g.status === 'active' ? 'Faol' : 'Arxiv'}
              </span>
            </div>
            <div className="space-y-1 mb-4">
              <p className="text-xs text-gray-500">
                {g.schedule_days?.join(', ') || '—'} {g.schedule_time ? `· ${g.schedule_time}` : ''}
              </p>
              <p className="text-xs text-gray-500">
                {studentCounts[g.id] ?? 0} / {g.max_students} o&apos;quvchi
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditGroup(g)} className="text-xs text-gray-400 hover:text-[#C0181B] transition-colors">Tahrirlash</button>
              <button onClick={() => handleDelete(g.id)} className="text-xs text-gray-400 hover:text-red-600 transition-colors">O&apos;chirish</button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <Modal title="Yangi guruh" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Guruh nomi" name="name" required />
            <Field label="Dars kunlari (vergul bilan)" name="schedule_days" placeholder="Du, Chor, Ju" />
            <Field label="Dars vaqti" name="schedule_time" placeholder="14:00" />
            <Field label="Max o'quvchilar" name="max_students" type="number" defaultValue="15" />
            <p className="text-xs text-gray-400">O&apos;qituvchini tayinlash uchun O&apos;qituvchilar sahifasidan foydalaning.</p>
            <SubmitBtn pending={isPending} label="Saqlash" />
          </form>
        </Modal>
      )}

      {editGroup && (
        <Modal title="Guruhni tahrirlash" onClose={() => setEditGroup(null)}>
          <form onSubmit={handleUpdate} className="space-y-4">
            <Field label="Guruh nomi" name="name" defaultValue={editGroup.name} required />
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">O&apos;qituvchi</p>
              <p className="text-sm font-medium text-[#1C1C2E]">{editGroup.teacher_name ?? "Tayinlanmagan"}</p>
            </div>
            <Field label="Dars kunlari" name="schedule_days" defaultValue={editGroup.schedule_days?.join(', ')} />
            <Field label="Dars vaqti" name="schedule_time" defaultValue={editGroup.schedule_time ?? ''} />
            <Field label="Max o'quvchilar" name="max_students" type="number" defaultValue={String(editGroup.max_students)} />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Holat</label>
              <select name="status" defaultValue={editGroup.status} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]">
                <option value="active">Faol</option>
                <option value="inactive">Arxiv</option>
              </select>
            </div>
            <SubmitBtn pending={isPending} label="Saqlash" />
          </form>
        </Modal>
      )}

      {moveStudent && (
        <Modal title={`${moveStudent.full_name} — guruhga ko'chirish`} onClose={() => setMoveStudent(null)}>
          <form onSubmit={handleMove} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Guruh tanlang</label>
              <select name="group_id" defaultValue={moveStudent.group_id ?? ''} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]">
                <option value="">Guruhsiz</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <SubmitBtn pending={isPending} label="Ko'chirish" />
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

function Field({ label, name, type = 'text', required, defaultValue, placeholder }: {
  label: string; name: string; type?: string; required?: boolean; defaultValue?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={type} name={name} defaultValue={defaultValue} required={required} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]"
      />
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

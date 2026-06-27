'use client';
import { useState, useTransition } from 'react';
import { createStudent, updateStudent, deleteStudent, regenerateStudentCode, regenerateParentCode } from './actions';

type Group = { id: number; name: string };
type Student = {
  id: number;
  full_name: string;
  access_code: string;
  status: string;
  enrolled_at: string | null;
  group_id: number | null;
  groups: { name: string } | null;
};

export function OquvchilarClient({ students, groups, parentCodeMap }: { students: Student[]; groups: Group[]; parentCodeMap: Record<number, string> }) {
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [revealedCode, setRevealedCode] = useState<{ label: string; code: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = students.filter(s => {
    const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.access_code.toLowerCase().includes(search.toLowerCase());
    const matchGroup = filterGroup ? String(s.group_id) === filterGroup : true;
    return matchSearch && matchGroup;
  });

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createStudent(fd);
      setShowAdd(false);
    });
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editStudent) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateStudent(editStudent.id, fd);
      setEditStudent(null);
    });
  }

  function handleDelete(id: number) {
    if (!confirm("O'quvchini o'chirishni tasdiqlaysizmi?")) return;
    startTransition(async () => { await deleteStudent(id); });
  }

  function handleRegenStudentCode(student: Student) {
    if (!confirm(`${student.full_name} uchun kirish kodi yangilansinmi?`)) return;
    startTransition(async () => {
      const result = await regenerateStudentCode(student.id);
      setRevealedCode({ label: `${student.full_name} — o'quvchi kodi`, code: result.code });
      setEditStudent(null);
    });
  }

  function handleRegenParentCode(student: Student) {
    if (!confirm(`${student.full_name} ota-onasi uchun kirish kodi yangilansinmi?`)) return;
    startTransition(async () => {
      const result = await regenerateParentCode(student.id);
      if (!result) { alert("Bu o'quvchiga bog'liq ota-ona topilmadi."); return; }
      setRevealedCode({ label: `${student.full_name} — ota-ona kodi`, code: result.code });
      setEditStudent(null);
    });
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          className="flex-1 min-w-48 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]"
          placeholder="Ism yoki kod bo'yicha qidirish..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]"
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
        >
          <option value="">Barcha guruhlar</option>
          {groups.map(g => <option key={g.id} value={String(g.id)}>{g.name}</option>)}
        </select>
        <button
          onClick={() => setShowAdd(true)}
          className="px-5 py-2 rounded-xl bg-[#C0181B] text-white text-sm font-semibold hover:bg-[#a01418] transition-colors"
        >
          + O&apos;quvchi qo&apos;shish
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">O&apos;quvchilar topilmadi</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Ism</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Guruh</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Kirish kodi</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Holat</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-[#1C1C2E]">{s.full_name}</td>
                  <td className="px-5 py-3 text-gray-500">{s.groups?.name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{s.access_code}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {s.status === 'active' ? 'Faol' : 'Arxiv'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditStudent(s)} className="text-xs text-gray-400 hover:text-[#C0181B] transition-colors">Tahrirlash</button>
                      <button onClick={() => handleDelete(s.id)} className="text-xs text-gray-400 hover:text-red-600 transition-colors">O&apos;chirish</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-400">{filtered.length} ta o&apos;quvchi</p>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Yangi o'quvchi" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="To'liq ism" name="full_name" required />
            <Field label="Ota-ona telefoni" name="parent_phone" type="tel" />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Guruh</label>
              <select name="group_id" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]">
                <option value="">Guruhsiz</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <SubmitBtn pending={isPending} label="Saqlash" />
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editStudent && (
        <Modal title="O'quvchini tahrirlash" onClose={() => setEditStudent(null)}>
          <form onSubmit={handleUpdate} className="space-y-4">
            <Field label="To'liq ism" name="full_name" defaultValue={editStudent.full_name} required />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Guruh</label>
              <select name="group_id" defaultValue={editStudent.group_id ?? ''} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]">
                <option value="">Guruhsiz</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Holat</label>
              <select name="status" defaultValue={editStudent.status} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]">
                <option value="active">Faol</option>
                <option value="inactive">Arxiv</option>
              </select>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">O&apos;quvchi kodi</p>
                  <p className="font-mono text-sm font-bold">{editStudent.access_code}</p>
                </div>
                <button type="button" onClick={() => handleRegenStudentCode(editStudent)}
                  className="text-xs text-amber-600 hover:text-amber-800 transition-colors">
                  Yangilash
                </button>
              </div>
              {parentCodeMap[editStudent.id] !== undefined && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Ota-ona kodi</p>
                    <p className="font-mono text-sm font-bold">{parentCodeMap[editStudent.id]}</p>
                  </div>
                  <button type="button" onClick={() => handleRegenParentCode(editStudent)}
                    className="text-xs text-amber-600 hover:text-amber-800 transition-colors">
                    Yangilash
                  </button>
                </div>
              )}
            </div>
            <SubmitBtn pending={isPending} label="Saqlash" />
          </form>
        </Modal>
      )}

      {/* Code reveal modal */}
      {revealedCode && (
        <Modal title="Yangi kirish kodi" onClose={() => setRevealedCode(null)}>
          <div className="space-y-4">
            <p className="text-xs text-gray-500">{revealedCode.label}</p>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-mono font-bold tracking-widest text-[#1C1C2E]">{revealedCode.code}</p>
            </div>
            <button onClick={() => navigator.clipboard.writeText(revealedCode.code)}
              className="w-full py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Nusxa olish
            </button>
            <button onClick={() => setRevealedCode(null)}
              className="w-full py-2.5 rounded-xl bg-[#C0181B] text-white text-sm font-semibold hover:bg-[#a01418] transition-colors">
              Tushundim
            </button>
          </div>
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

function Field({ label, name, type = 'text', required, defaultValue }: {
  label: string; name: string; type?: string; required?: boolean; defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={type} name={name} defaultValue={defaultValue} required={required}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]"
      />
    </div>
  );
}

function SubmitBtn({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit" disabled={pending}
      className="w-full py-2.5 rounded-xl bg-[#C0181B] text-white text-sm font-semibold hover:bg-[#a01418] transition-colors disabled:opacity-50"
    >
      {pending ? 'Saqlanmoqda...' : label}
    </button>
  );
}

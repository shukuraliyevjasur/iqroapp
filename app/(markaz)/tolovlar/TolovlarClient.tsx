'use client';
import { useState, useTransition } from 'react';
import { createPayment, updatePaymentStatus, deletePayment } from './actions';

type Student = { id: number; full_name: string };
type Payment = {
  id: number; student_id: number; amount_uzs: number; month_label: string;
  due_date: string; paid_date: string | null; status: string;
  payment_method: string | null; notes: string | null;
  students: { full_name: string } | null;
};

const STATUS_LABELS: Record<string, string> = { paid: 'To\'langan', pending: 'Kutilmoqda', overdue: 'Muddati o\'tgan' };
const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
};

export function TolovlarClient({ payments, students }: { payments: Payment[]; students: Student[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [isPending, startTransition] = useTransition();

  const filtered = filterStatus ? payments.filter(p => p.status === filterStatus) : payments;

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => { await createPayment(fd); setShowAdd(false); });
  }

  function markPaid(id: number) {
    const today = new Date().toISOString().split('T')[0];
    startTransition(async () => { await updatePaymentStatus(id, 'paid', today); });
  }

  function handleDelete(id: number) {
    if (!confirm("To'lovni o'chirishni tasdiqlaysizmi?")) return;
    startTransition(async () => { await deletePayment(id); });
  }

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount_uzs, 0);
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount_uzs, 0);

  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "To'langan", value: `${(totalPaid / 1_000_000).toFixed(1)} mln`, color: 'text-green-600' },
          { label: "Muddati o'tgan", value: `${(totalOverdue / 1_000_000).toFixed(1)} mln`, color: 'text-red-600' },
          { label: 'Jami yozuvlar', value: String(payments.length), color: 'text-[#1C1C2E]' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]">
          <option value="">Barcha holatlar</option>
          <option value="paid">To&apos;langan</option>
          <option value="pending">Kutilmoqda</option>
          <option value="overdue">Muddati o&apos;tgan</option>
        </select>
        <button onClick={() => setShowAdd(true)}
          className="ml-auto px-5 py-2 rounded-xl bg-[#C0181B] text-white text-sm font-semibold hover:bg-[#a01418] transition-colors">
          + To&apos;lov qo&apos;shish
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">Yozuvlar topilmadi</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['O\'quvchi', 'Oy', 'Miqdor', 'Holat', 'Usul', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1C1C2E]">{p.students?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.month_label}</td>
                  <td className="px-4 py-3 font-mono text-sm">{p.amount_uzs.toLocaleString()} so&apos;m</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.payment_method ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      {p.status !== 'paid' && (
                        <button onClick={() => markPaid(p.id)} className="text-xs text-green-600 hover:text-green-800 transition-colors">To&apos;landi</button>
                      )}
                      <button onClick={() => handleDelete(p.id)} className="text-xs text-gray-400 hover:text-red-600 transition-colors">O&apos;chirish</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-[#1C1C2E]">To&apos;lov qo&apos;shish</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">O&apos;quvchi</label>
                <select name="student_id" required className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]">
                  <option value="">Tanlang...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Oy</label>
                <input name="month_label" required placeholder="Iyun 2026" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Miqdor (so&apos;m)</label>
                <input name="amount_uzs" type="number" required placeholder="500000" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Muddati</label>
                <input name="due_date" type="date" required className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Holat</label>
                <select name="status" defaultValue="pending" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]">
                  <option value="pending">Kutilmoqda</option>
                  <option value="paid">To&apos;langan</option>
                  <option value="overdue">Muddati o&apos;tgan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">To&apos;lov usuli</label>
                <select name="payment_method" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]">
                  <option value="">Tanlang</option>
                  <option value="cash">Naqd</option>
                  <option value="card">Karta</option>
                  <option value="transfer">O&apos;tkazma</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Izoh</label>
                <input name="notes" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C0181B]" />
              </div>
              <input type="hidden" name="paid_date" value="" />
              <button type="submit" disabled={isPending}
                className="w-full py-2.5 rounded-xl bg-[#C0181B] text-white text-sm font-semibold hover:bg-[#a01418] transition-colors disabled:opacity-50">
                {isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

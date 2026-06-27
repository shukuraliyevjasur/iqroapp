'use client';
import { useLang } from '@/lib/i18n/context';

const PAY_MAP: Record<string, { key: string; color: string }> = {
  paid:    { key: 'portalPaid',    color: 'bg-green-100 text-green-700' },
  pending: { key: 'portalPending', color: 'bg-amber-100 text-amber-700' },
  overdue: { key: 'portalOverdue', color: 'bg-red-100 text-red-700'    },
};

export function PaymentList({ payments }: {
  payments: { month_label: string; amount_uzs: number; status: string; due_date: string; paid_date: string | null; payment_method: string | null }[];
}) {
  const { t } = useLang();
  const overdue = payments.filter(p => p.status === 'overdue');

  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-xl font-bold text-[#1C1C2E]">{t('portalPayments')}</h1>
      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-sm font-semibold text-red-700">{overdue.length} ta {t('portalOverdue').toLowerCase()}</p>
          <p className="text-xs text-red-500 mt-0.5">{overdue.map(p => p.month_label).join(', ')}</p>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {payments.length === 0 ? (
          <p className="p-6 text-center text-gray-400 text-sm">{t('portalNoData')}</p>
        ) : payments.map((p, i) => (
          <div key={i} className={`px-5 py-4 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#1C1C2E]">{p.month_label}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAY_MAP[p.status]?.color ?? 'bg-gray-100 text-gray-500'}`}>
                {t(PAY_MAP[p.status]?.key ?? p.status)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">{p.amount_uzs.toLocaleString()} so&apos;m</p>
              {p.paid_date && <p className="text-xs text-gray-400">{p.paid_date}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';
import { useLang } from '@/lib/i18n/context';

const STATUS_MAP: Record<string, { key: string; color: string }> = {
  present: { key: 'portalPresent', color: 'bg-green-100 text-green-700' },
  absent:  { key: 'portalAbsent',  color: 'bg-red-100 text-red-700'   },
  late:    { key: 'portalLate',    color: 'bg-amber-100 text-amber-700' },
};

export function AttendanceList({ attendance }: { attendance: { date: string; status: string }[] }) {
  const { t } = useLang();
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;

  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-xl font-bold text-[#1C1C2E]">{t('portalAttendance')}</h1>
      <div className="flex gap-3">
        <div className="flex-1 bg-green-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{presentCount}</p>
          <p className="text-xs text-green-600 mt-1">{t('portalPresent')}</p>
        </div>
        <div className="flex-1 bg-red-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{absentCount}</p>
          <p className="text-xs text-red-600 mt-1">{t('portalAbsent')}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {attendance.length === 0 ? (
          <p className="p-6 text-center text-gray-400 text-sm">{t('portalNoData')}</p>
        ) : attendance.map((a, i) => (
          <div key={i} className={`flex items-center justify-between px-5 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
            <span className="text-sm text-gray-600">{a.date}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_MAP[a.status]?.color ?? 'bg-gray-100 text-gray-500'}`}>
              {t(STATUS_MAP[a.status]?.key ?? a.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

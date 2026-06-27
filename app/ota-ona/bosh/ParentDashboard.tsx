'use client';
import { useLang } from '@/lib/i18n/context';
import Link from 'next/link';

const STATUS_MAP: Record<string, { key: string; color: string }> = {
  present: { key: 'portalPresent', color: 'bg-green-100 text-green-700' },
  absent:  { key: 'portalAbsent',  color: 'bg-red-100 text-red-700'   },
  late:    { key: 'portalLate',    color: 'bg-amber-100 text-amber-700' },
};

const PAY_MAP: Record<string, { key: string; color: string }> = {
  paid:    { key: 'portalPaid',    color: 'bg-green-100 text-green-700' },
  pending: { key: 'portalPending', color: 'bg-amber-100 text-amber-700' },
  overdue: { key: 'portalOverdue', color: 'bg-red-100 text-red-700'    },
};

export function ParentDashboard({ parentName, student, group, recentAttendance, recentPayments }: {
  parentName: string;
  student: { id: number; full_name: string; access_code: string } | null;
  group: { name: string; schedule_days: string[]; schedule_time: string | null; teacher_name: string } | null;
  recentAttendance: { date: string; status: string }[];
  recentPayments: { month_label: string; amount_uzs: number; status: string }[];
}) {
  const { t } = useLang();

  return (
    <div className="space-y-5 pt-2">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-widest">{t('portalWelcome')}</p>
        <h1 className="text-xl font-bold text-[#1C1C2E] mt-0.5">{parentName}</h1>
      </div>

      {/* Child info */}
      {student ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">{t('portalChild')}</p>
          <p className="text-lg font-bold text-[#1C1C2E]">{student.full_name}</p>
          {group && (
            <>
              <p className="text-sm text-gray-500 mt-1">{t('portalGroup')}: <span className="font-medium text-[#1C1C2E]">{group.name}</span></p>
              {group.teacher_name && <p className="text-sm text-gray-500">{t('portalTeacher')}: {group.teacher_name}</p>}
              {(group.schedule_days?.length > 0 || group.schedule_time) && (
                <p className="text-sm text-gray-500">{t('portalSchedule')}: {group.schedule_days?.join(', ')} {group.schedule_time ? `· ${group.schedule_time}` : ''}</p>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-sm text-gray-400">{t('portalNoData')}</div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/ota-ona/davomat', label: t('portalAttendance'), color: 'bg-green-50 text-green-700' },
          { href: '/ota-ona/tolovlar', label: t('portalPayments'), color: 'bg-amber-50 text-amber-700' },
          { href: '/ota-ona/darslar', label: t('portalLessons'), color: 'bg-blue-50 text-blue-700' },
        ].map(l => (
          <Link key={l.href} href={l.href}
            className={`${l.color} rounded-2xl p-4 text-xs font-semibold text-center hover:opacity-80 transition-opacity`}>
            {l.label}
          </Link>
        ))}
      </div>

      {/* Recent attendance */}
      {recentAttendance.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{t('portalAttendance')}</p>
            <Link href="/ota-ona/davomat" className="text-xs text-[#C0181B]">Barchasi &rarr;</Link>
          </div>
          <div className="space-y-2">
            {recentAttendance.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{a.date}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_MAP[a.status]?.color ?? 'bg-gray-100 text-gray-500'}`}>
                  {t(STATUS_MAP[a.status]?.key ?? a.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent payments */}
      {recentPayments.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{t('portalPayments')}</p>
            <Link href="/ota-ona/tolovlar" className="text-xs text-[#C0181B]">Barchasi &rarr;</Link>
          </div>
          <div className="space-y-2">
            {recentPayments.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{p.month_label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{p.amount_uzs.toLocaleString()}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAY_MAP[p.status]?.color ?? 'bg-gray-100 text-gray-500'}`}>
                    {t(PAY_MAP[p.status]?.key ?? p.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

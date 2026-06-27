'use client';
import { useLang } from '@/lib/i18n/context';
import Link from 'next/link';

const STATUS_MAP: Record<string, { key: string; color: string }> = {
  present: { key: 'portalPresent', color: 'bg-green-100 text-green-700' },
  absent:  { key: 'portalAbsent',  color: 'bg-red-100 text-red-700'   },
  late:    { key: 'portalLate',    color: 'bg-amber-100 text-amber-700' },
};

export function StudentDashboard({ studentName, group, recentAttendance, recentLessons, examResults }: {
  studentName: string;
  group: { name: string; schedule_days: string[]; schedule_time: string | null; teacher_name: string } | null;
  recentAttendance: { date: string; status: string }[];
  recentLessons: { lesson_date: string; title: string }[];
  examResults: { score: number | null; exams: { title: string; exam_date: string; max_score: number } | null }[];
}) {
  const { t } = useLang();

  return (
    <div className="space-y-5 pt-2">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-widest">{t('portalWelcome')}</p>
        <h1 className="text-xl font-bold text-[#1C1C2E] mt-0.5">{studentName}</h1>
      </div>

      {/* Group / Schedule */}
      {group && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{t('portalMySchedule')}</p>
          <p className="font-bold text-[#1C1C2E]">{group.name}</p>
          {group.teacher_name && <p className="text-sm text-gray-500 mt-1">{t('portalTeacher')}: {group.teacher_name}</p>}
          {(group.schedule_days?.length > 0 || group.schedule_time) && (
            <p className="text-sm text-gray-500">{group.schedule_days?.join(', ')} {group.schedule_time ? `· ${group.schedule_time}` : ''}</p>
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/talaba/davomat" className="bg-green-50 text-green-700 rounded-2xl p-4 text-xs font-semibold text-center hover:opacity-80 transition-opacity">{t('portalAttendance')}</Link>
        <Link href="/talaba/darslar" className="bg-blue-50 text-blue-700 rounded-2xl p-4 text-xs font-semibold text-center hover:opacity-80 transition-opacity">{t('portalLessons')}</Link>
      </div>

      {/* Recent attendance */}
      {recentAttendance.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{t('portalAttendance')}</p>
            <Link href="/talaba/davomat" className="text-xs text-[#C0181B]">Barchasi &rarr;</Link>
          </div>
          <div className="space-y-2">
            {recentAttendance.map((a, i) => (
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

      {/* Recent lessons */}
      {recentLessons.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{t('portalLessons')}</p>
            <Link href="/talaba/darslar" className="text-xs text-[#C0181B]">Barchasi &rarr;</Link>
          </div>
          <div className="space-y-2">
            {recentLessons.map((l, i) => (
              <div key={i}>
                <p className="text-[10px] text-gray-400">{l.lesson_date}</p>
                <p className="text-sm font-medium text-[#1C1C2E]">{l.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exam results */}
      {examResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">{t('portalMyGrades')}</p>
          <div className="space-y-2">
            {examResults.map((r, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#1C1C2E]">{r.exams?.title}</p>
                  <p className="text-[10px] text-gray-400">{r.exams?.exam_date}</p>
                </div>
                <span className="text-sm font-bold text-[#C0181B]">
                  {r.score ?? '—'} / {r.exams?.max_score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

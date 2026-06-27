'use client';
import { useLang } from '@/lib/i18n/context';

export function LessonList({ lessons }: { lessons: { lesson_date: string; title: string; material_link: string | null }[] }) {
  const { t } = useLang();
  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-xl font-bold text-[#1C1C2E]">{t('portalLessons')}</h1>
      <div className="space-y-3">
        {lessons.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-gray-400 text-sm">{t('portalNoData')}</div>
        ) : lessons.map((l, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] text-gray-400 mb-1">{l.lesson_date}</p>
            <p className="text-sm font-semibold text-[#1C1C2E]">{l.title}</p>
            {l.material_link && (
              <a href={l.material_link} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#C0181B] mt-1 inline-block hover:underline">
                {t('portalMaterial')} &rarr;
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n/context';
import type { Lang } from '@/lib/i18n/types';

const LANGS: { code: Lang; native: string }[] = [
  { code: 'en', native: 'English'  },
  { code: 'uz', native: "O'zbek"   },
  { code: 'ru', native: 'Русский'  },
];

const PROGRAMS: Record<Lang, string[]> = {
  en: ['English', 'IELTS', 'Mathematics', 'Robotics', 'School Prep'],
  uz: ['English', 'IELTS', 'Matematika', 'Robototexnika', 'Maktabga tayyorlov'],
  ru: ['English', 'IELTS', 'Математика', 'Робототехника', 'Подготовка к школе'],
};

const PROGRAMS_LABEL: Record<Lang, string> = {
  en: 'Our programs',
  uz: 'Dasturlarimiz',
  ru: 'Наши программы',
};

const TOTAL_SLIDES = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const { lang, setLang, t } = useLang();
  const [slide, setSlide] = useState(0);

  function finish() {
    localStorage.setItem('iqro_onboarded', '1');
    router.replace('/');
  }

  function next() {
    if (slide < TOTAL_SLIDES - 1) setSlide(slide + 1);
    else finish();
  }

  return (
    <div className="min-h-screen bg-[#C0181B] flex flex-col">
      {/* Skip */}
      <div className="flex justify-end px-6 pt-5">
        <button onClick={finish} className="text-white/60 text-sm font-medium hover:text-white transition-colors">
          {t('skip')} →
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6">

        {/* ── Slide 0: Language picker ── */}
        {slide === 0 && (
          <div className="w-full max-w-xs animate-fade-in text-center">
            <h1 className="text-7xl font-bold text-white tracking-widest mb-5 font-[family-name:var(--font-cinzel)]">
              IQRO
            </h1>
            <p className="text-white/50 text-[11px] tracking-[0.3em] uppercase mb-12">
              Iqro Academy
            </p>

            <div className="space-y-3 mb-6">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-semibold text-sm transition-all ${
                    lang === l.code
                      ? 'bg-white text-[#C0181B] shadow-lg'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  <span>{l.native}</span>
                  {lang === l.code && (
                    <svg className="w-4 h-4 text-[#C0181B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSlide(1)}
              className="w-full bg-white text-[#C0181B] rounded-2xl py-4 font-bold text-sm tracking-wide hover:bg-white/95 transition-all"
            >
              {t('next')}
            </button>
          </div>
        )}

        {/* ── Slide 1: Welcome ── */}
        {slide === 1 && (
          <div className="w-full max-w-xs animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-white/15 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">{t('welcomeTitle')}</h2>
              <p className="text-white/70 text-sm leading-relaxed">{t('welcomeBody')}</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-3">
                {PROGRAMS_LABEL[lang]}
              </p>
              <div className="flex flex-wrap gap-2">
                {PROGRAMS[lang].map((s) => (
                  <span key={s} className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Slide 2: Features ── */}
        {slide === 2 && (
          <div className="w-full max-w-xs animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">{t('featuresTitle')}</h2>
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4">
                <p className="text-[10px] font-semibold text-[#C0181B] uppercase tracking-widest mb-3">
                  {t('featuresParentLabel')}
                </p>
                <div className="space-y-2">
                  {['featureAttendance', 'featurePayments', 'featureHomework', 'featureGrades'].map((key) => (
                    <div key={key} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[#C0181B]/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-[#C0181B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm text-[#1C1C2E]">{t(key)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4">
                <p className="text-[10px] font-semibold text-[#C0181B] uppercase tracking-widest mb-3">
                  {t('featuresStudentLabel')}
                </p>
                <div className="space-y-2">
                  {['featureSchedule', 'featureLessons', 'featureLibrary', 'featureResults'].map((key) => (
                    <div key={key} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[#C0181B]/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-[#C0181B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm text-[#1C1C2E]">{t(key)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Slide 3: How to log in ── */}
        {slide === 3 && (
          <div className="w-full max-w-xs animate-fade-in text-center">
            <div className="w-20 h-20 bg-white/15 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">{t('loginTitle')}</h2>
            <p className="text-white/70 text-sm leading-relaxed mb-8">{t('loginBody')}</p>
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-3">
                {t('loginCodeLabel')}
              </p>
              <div className="flex justify-center gap-2">
                {['A', 'B', 'C', '1', '2', '3'].map((c, i) => (
                  <div key={i} className="w-10 h-12 bg-white rounded-xl flex items-center justify-center text-[#C0181B] font-bold text-lg shadow-sm">
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom — dots + button (slides 1-3) */}
      {slide > 0 && (
        <div className="flex flex-col items-center px-6 pb-10 gap-5">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  slide === i ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/30'
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-full max-w-xs bg-white text-[#C0181B] rounded-2xl py-4 font-bold text-sm tracking-wide hover:bg-white/95 transition-all"
          >
            {slide === TOTAL_SLIDES - 1 ? t('getStarted') : t('next')}
          </button>
        </div>
      )}
    </div>
  );
}

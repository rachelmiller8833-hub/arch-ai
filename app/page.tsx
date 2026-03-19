// app/page.tsx — Landing page
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lang } from '@/types';
import LandingHero from '@/app/components/LandingHero';

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('en');
  const router = useRouter();
  const isHe = lang === 'he';

  function goToProject() {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('archai_lang', lang);
    }
    router.push('/project');
  }

  function goToDemo() {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('archai_demo', '1');
      sessionStorage.setItem('archai_demo_lang', lang);
    }
    router.push('/project');
  }

  return (
    <div className="bg-slate-950 text-white min-h-screen" dir={isHe ? 'rtl' : 'ltr'}>

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-sm">
        <div className="w-full px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold font-mono">A</span>
            </div>
            <span className="font-bold text-sm tracking-tight text-white">ArchAI</span>
            <span className="hidden sm:block text-xs ml-1 text-slate-500">
              {isHe ? 'סיעור מוחות ארכיטקטורה עם AI' : 'AI Architecture Brainstorming'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(isHe ? 'en' : 'he')}
              className="text-xs px-3 py-1.5 rounded-md border border-slate-700 hover:bg-slate-800 text-slate-400 transition-colors"
            >
              {isHe ? 'EN' : 'עב'}
            </button>
            <button
              onClick={goToProject}
              className="text-xs px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
            >
              {isHe ? 'פתח את האפליקציה ←' : 'Open App →'}
            </button>
          </div>
        </div>
      </nav>

      <LandingHero lang={lang} onScrollToForm={goToProject} onDemoSkip={goToDemo} />
    </div>
  );
}

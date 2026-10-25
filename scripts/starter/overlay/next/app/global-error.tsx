'use client';

import '../src/index.css';

const COPY = {
  en: { title: 'Something went wrong', description: 'The page could not load. Try again in a moment.', retry: 'Try again' },
  ar: { title: 'حدث خطأ ما', description: 'تعذّر تحميل الصفحة. حاول مرة أخرى بعد قليل.', retry: 'حاول مرة أخرى' },
};

// When even the root layout fails: its own page, in the language of the URL, without the app's providers.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const lang = typeof window !== 'undefined' && window.location.pathname.startsWith('/ar') ? 'ar' : 'en';
  const copy = COPY[lang];

  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <body className="bg-canvas text-fg">
        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-xl font-semibold">{copy.title}</h1>
          <p className="text-fg-muted text-sm">{copy.description}</p>
          <button type="button" onClick={reset} className="focus-ring-input h-control-md rounded-md border px-4 text-sm">
            {copy.retry}
          </button>
        </main>
      </body>
    </html>
  );
}

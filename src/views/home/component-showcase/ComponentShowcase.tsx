import { useAppTranslation } from '@hooks/shared';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

const SIDEBAR_ITEMS = ['Button', 'Card', 'Dialog', 'Input', 'Select', 'Tabs', 'Toast'];

function getFadeUp(prefersReduced: boolean | null, delay = 0) {
  if (prefersReduced) return {};
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const, delay },
  };
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground flex items-center gap-3 text-[11px] font-semibold tracking-[0.18em] uppercase">
      <span className="bg-primary h-px w-8" />
      {children}
    </p>
  );
}
export default function ComponentShowcase() {
  const pr = useReducedMotion();
  const { t } = useAppTranslation('home');

  return (
    <section className="mx-auto max-w-6xl px-6 py-24 lg:px-8 lg:py-32">
      <div className="grid items-center gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <motion.div {...getFadeUp(pr)}>
          <Eyebrow>{t('showcase.eyebrow')}</Eyebrow>
          <h2 className="text-foreground mt-5 mb-4 text-[clamp(1.8rem,3.5vw,2.6rem)] leading-tight font-medium tracking-[-0.01em]">
            {t('showcase.title')}
          </h2>
          <p className="text-muted-foreground mb-6 text-[15px] leading-relaxed">{t('showcase.desc')}</p>
          <a
            href="/components"
            className="text-primary hover:text-primary-600 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            {t('showcase.cta')}
            <ArrowRight size={15} className="rtl:rotate-180" />
          </a>
        </motion.div>

        <motion.div {...getFadeUp(pr, 0.15)}>
          <div className="border-border bg-background shadow-spread overflow-hidden rounded-2xl border">
            <div className="border-border flex items-center gap-2 border-b px-4 py-3">
              <span className="bg-muted-200 h-2.5 w-2.5 rounded-full" />
              <span className="bg-muted-200 h-2.5 w-2.5 rounded-full" />
              <span className="bg-muted-200 h-2.5 w-2.5 rounded-full" />
              <span className="text-muted-foreground ms-3 text-[11px]">{t('showcase.browserUrl')}</span>
            </div>

            <div className="flex">
              <div className="border-border hidden w-44 border-e p-4 md:block">
                <div className="bg-secondary text-muted-foreground mb-3 rounded-md px-3 py-1.5 text-[11px]">
                  {t('showcase.searchPlaceholder')}
                </div>
                <div className="flex flex-col gap-0.5">
                  {SIDEBAR_ITEMS.map((item, idx) => (
                    <div
                      key={item}
                      className={`rounded-md px-3 py-1.5 text-[12px] ${
                        idx === 0 ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 p-5">
                <h4 className="text-foreground mb-1 text-[15px] font-semibold">{t('showcase.buttonTitle')}</h4>
                <p className="text-muted-foreground mb-4 text-[12px]">{t('showcase.buttonDesc')}</p>
                <div className="bg-border mb-4 h-px" />
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-[12px] font-medium">
                    {t('showcase.variantDefault')}
                  </span>
                  <span className="border-border text-foreground rounded-md border px-3 py-1.5 text-[12px] font-medium">
                    {t('showcase.variantOutline')}
                  </span>
                  <span className="text-muted-foreground rounded-md px-3 py-1.5 text-[12px] font-medium">{t('showcase.variantGhost')}</span>
                </div>
                <div className="bg-code-surface rounded-md p-3">
                  <code className="text-code-foreground text-[11px]">{'<Button variant="default">Click me</Button>'}</code>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

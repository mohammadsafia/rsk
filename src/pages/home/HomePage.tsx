import { type CSSProperties, type ReactNode } from 'react';

import { useAppTranslation } from '@hooks/shared';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

import { ThemeSwitcher } from '@components/shared';

/* -------------------------------------------------------------------------- */
/*  Type & helpers                                                            */
/* -------------------------------------------------------------------------- */

const display: CSSProperties = { fontFamily: "'Fraunces', Georgia, serif" };

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

/* -------------------------------------------------------------------------- */
/*  Content                                                                   */
/* -------------------------------------------------------------------------- */

const STATS = [
  { value: '35', labelKey: 'stats.uiComponents' },
  { value: '17', labelKey: 'stats.formComponents' },
  { value: '79', labelKey: 'stats.mdxDocs' },
  { value: '24', labelKey: 'stats.sharedComponents' },
];

const FEATURES = [
  {
    id: 'componentLibrary',
    titleKey: 'features.componentLibrary.title',
    descKey: 'features.componentLibrary.desc',
    large: true,
  },
  {
    id: 'formSystem',
    titleKey: 'features.formSystem.title',
    descKey: 'features.formSystem.desc',
  },
  {
    id: 'dataTables',
    titleKey: 'features.dataTables.title',
    descKey: 'features.dataTables.desc',
  },
  {
    id: 'authentication',
    titleKey: 'features.authentication.title',
    descKey: 'features.authentication.desc',
  },
  {
    id: 'internationalization',
    titleKey: 'features.internationalization.title',
    descKey: 'features.internationalization.desc',
  },
  {
    id: 'errorMonitoring',
    titleKey: 'features.errorMonitoring.title',
    descKey: 'features.errorMonitoring.desc',
  },
];

const TECH_STACK = ['React', 'Vite', 'TypeScript', 'Tailwind CSS', 'Radix UI'];

const FOLDER_TREE = [
  { text: 'src/', alias: '' },
  { text: '├── api/', alias: '→ @api' },
  { text: '├── components/', alias: '' },
  { text: '│   ├── ui/', alias: '→ @components/ui' },
  { text: '│   ├── forms/', alias: '→ @components/forms' },
  { text: '│   └── shared/', alias: '→ @components/shared' },
  { text: '├── layouts/', alias: '→ @layouts' },
  { text: '├── lib/', alias: '' },
  { text: '│   ├── hooks/', alias: '→ @hooks' },
  { text: '│   ├── utils/', alias: '→ @utils' },
  { text: '│   └── contexts/', alias: '→ @contexts' },
  { text: '├── pages/', alias: '→ @pages' },
  { text: '└── routes/', alias: '→ @routes' },
];

const GETTING_STARTED_STEPS = [
  { number: '01', titleKey: 'gettingStarted.clone', code: 'git clone https://github.com/mohammadsafia/rsk.git' },
  { number: '02', titleKey: 'gettingStarted.install', code: 'yarn install' },
  { number: '03', titleKey: 'gettingStarted.start', code: 'yarn dev' },
];

const SIDEBAR_ITEMS = ['Button', 'Card', 'Dialog', 'Input', 'Select', 'Tabs', 'Toast'];

/* -------------------------------------------------------------------------- */
/*  Navbar                                                                    */
/* -------------------------------------------------------------------------- */

function Navbar() {
  const { t } = useAppTranslation('home');

  const links = [
    { label: t('nav.features'), href: '#features' },
    { label: t('nav.components'), href: '/components' },
    { label: t('nav.github'), href: 'https://github.com/mohammadsafia/rsk' },
  ];

  return (
    <nav className="border-border bg-background/70 fixed inset-x-0 top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
        <a href="/" className="flex items-center gap-2.5" aria-label={t('nav.logoAlt')}>
          <span className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold">R</span>
          <span className="text-foreground text-sm font-semibold tracking-tight">{t('nav.brand')}</span>
        </a>

        <div className="flex items-center gap-7">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-muted-foreground hover:text-foreground hidden text-sm transition-colors sm:block"
            >
              {link.label}
            </a>
          ))}
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

function Hero() {
  const pr = useReducedMotion();
  const { t } = useAppTranslation('home');

  return (
    <section className="relative overflow-hidden">
      {/* Fading grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: 'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 75% 60% at 50% 0%, #000 35%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 60% at 50% 0%, #000 35%, transparent 100%)',
        }}
      />
      <div aria-hidden className="bg-primary/10 pointer-events-none absolute -top-32 end-[-10%] -z-10 h-[28rem] w-[28rem] rounded-full blur-[120px]" />

      <div className="mx-auto max-w-6xl px-6 pt-36 pb-20 lg:px-8 lg:pt-44 lg:pb-28">
        <div className="grid items-end gap-14 md:grid-cols-[1.7fr_1fr]">
          <motion.div {...getFadeUp(pr)}>
            <Eyebrow>{t('hero.eyebrow')}</Eyebrow>

            <h1
              style={display}
              className="text-foreground mt-6 mb-6 text-[clamp(2.6rem,6.2vw,4.6rem)] leading-[1.02] font-medium tracking-[-0.02em] text-balance"
            >
              {t('hero.titleLead')}
              <span className="text-primary italic">{t('hero.titleEmphasis')}</span>
              {t('hero.titleTrail')}
            </h1>

            <p className="text-muted-foreground max-w-lg text-[15px] leading-relaxed text-pretty">{t('hero.subtitle')}</p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#getting-started"
                className="bg-primary text-primary-foreground hover:bg-primary-600 group inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
              >
                {t('hero.ctaPrimary')}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
              </a>
              <a
                href="/components"
                className="text-foreground border-border hover:bg-secondary inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors"
              >
                {t('hero.ctaSecondary')}
              </a>
            </div>
          </motion.div>

          {/* Stats — asymmetric editorial column */}
          <motion.div className="border-border grid grid-cols-2 gap-x-8 gap-y-7 md:grid-cols-1 md:border-s md:ps-10" {...getFadeUp(pr, 0.15)}>
            {STATS.map((stat) => (
              <div key={stat.labelKey}>
                <p style={display} className="text-foreground text-[2.4rem] leading-none font-medium">
                  {stat.value}
                </p>
                <p className="text-muted-foreground mt-2 text-[10px] tracking-[0.14em] uppercase">{t(stat.labelKey)}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tech stack                                                                */
/* -------------------------------------------------------------------------- */

function TechStack() {
  const pr = useReducedMotion();
  const { t } = useAppTranslation('home');

  return (
    <motion.section className="border-border mx-auto max-w-6xl border-y px-6 py-8 lg:px-8" {...getFadeUp(pr)}>
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 md:justify-between">
        <span className="text-muted-foreground text-[11px] tracking-[0.16em] uppercase">{t('techStack.builtOn')}</span>
        {TECH_STACK.map((name) => (
          <span key={name} className="text-foreground/70 hover:text-foreground text-sm font-medium transition-colors">
            {name}
          </span>
        ))}
      </div>
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Features (bento)                                                          */
/* -------------------------------------------------------------------------- */

function Features() {
  const pr = useReducedMotion();
  const { t } = useAppTranslation('home');

  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24 lg:px-8 lg:py-32">
      <motion.div className="mb-12 max-w-2xl" {...getFadeUp(pr)}>
        <Eyebrow>{t('features.eyebrow')}</Eyebrow>
        <h2 style={display} className="text-foreground mt-5 text-[clamp(1.8rem,3.5vw,2.6rem)] leading-tight font-medium tracking-[-0.01em]">
          {t('features.title')}
        </h2>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.id}
            className={`group border-border bg-secondary/30 hover:border-primary/40 hover:bg-secondary/60 relative overflow-hidden rounded-2xl border p-6 transition-colors ${
              feature.large ? 'md:row-span-2 md:p-8' : ''
            }`}
            {...getFadeUp(pr, i * 0.06)}
          >
            {feature.large && <div className="bg-primary absolute inset-x-0 top-0 h-0.5" />}
            <h3 className={`text-foreground font-semibold ${feature.large ? 'text-lg' : 'text-[15px]'}`}>{t(feature.titleKey)}</h3>
            <p className="text-muted-foreground mt-2 text-[13px] leading-relaxed">{t(feature.descKey)}</p>
            {feature.large && (
              <p style={display} className="text-primary/15 mt-auto hidden pt-10 text-6xl font-medium md:block">
                01
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component showcase                                                        */
/* -------------------------------------------------------------------------- */

function ComponentShowcase() {
  const pr = useReducedMotion();
  const { t } = useAppTranslation('home');

  return (
    <section className="mx-auto max-w-6xl px-6 py-24 lg:px-8 lg:py-32">
      <div className="grid items-center gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <motion.div {...getFadeUp(pr)}>
          <Eyebrow>{t('showcase.eyebrow')}</Eyebrow>
          <h2 style={display} className="text-foreground mt-5 mb-4 text-[clamp(1.8rem,3.5vw,2.6rem)] leading-tight font-medium tracking-[-0.01em]">
            {t('showcase.title')}
          </h2>
          <p className="text-muted-foreground mb-6 text-[15px] leading-relaxed">{t('showcase.desc')}</p>
          <a href="/components" className="text-primary hover:text-primary-600 inline-flex items-center gap-1.5 text-sm font-medium transition-colors">
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
                <div className="bg-secondary text-muted-foreground mb-3 rounded-md px-3 py-1.5 text-[11px]">{t('showcase.searchPlaceholder')}</div>
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
                  <span className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-[12px] font-medium">{t('showcase.variantDefault')}</span>
                  <span className="border-border text-foreground rounded-md border px-3 py-1.5 text-[12px] font-medium">{t('showcase.variantOutline')}</span>
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

/* -------------------------------------------------------------------------- */
/*  CLI                                                                       */
/* -------------------------------------------------------------------------- */

function CliSection() {
  const pr = useReducedMotion();
  const { t } = useAppTranslation('home');

  return (
    <section className="mx-auto max-w-6xl px-6 py-24 lg:px-8 lg:py-32">
      <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <motion.div className="order-2 md:order-1" {...getFadeUp(pr)}>
          <div className="bg-code-surface shadow-spread overflow-hidden rounded-2xl" dir="ltr">
            <div className="flex items-center gap-2 px-4 py-3">
              <span className="bg-code-muted/30 h-2.5 w-2.5 rounded-full" />
              <span className="bg-code-muted/30 h-2.5 w-2.5 rounded-full" />
              <span className="bg-code-muted/30 h-2.5 w-2.5 rounded-full" />
            </div>
            <div className="px-5 pb-5 font-mono text-[13px] leading-relaxed">
              <p>
                <span className="text-primary-300">$ </span>
                <span className="text-code-foreground">npx rsk dto:gen</span>
              </p>
              <p className="text-code-muted">&nbsp; &#10003; {t('cli.logFetching')}</p>
              <p className="text-code-muted">&nbsp; &#10003; {t('cli.logParsing')}</p>
              <p className="text-code-muted">&nbsp; &#10003; {t('cli.logGenerating')}</p>
              <p className="text-code-muted">&nbsp; &#10003; {t('cli.logFormatting')}</p>
              <p className="text-code-muted">&nbsp; &#10003; {t('cli.logWritten')}</p>
              <p className="mt-4">
                <span className="text-primary-300">$ </span>
                <span className="text-code-foreground">npx rsk dto:list</span>
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div className="order-1 md:order-2" {...getFadeUp(pr, 0.15)}>
          <Eyebrow>{t('cli.eyebrow')}</Eyebrow>
          <h2 style={display} className="text-foreground mt-5 mb-4 text-[clamp(1.8rem,3.5vw,2.6rem)] leading-tight font-medium tracking-[-0.01em]">
            {t('cli.title')}
          </h2>
          <p className="text-muted-foreground text-[15px] leading-relaxed">{t('cli.desc')}</p>
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Architecture                                                              */
/* -------------------------------------------------------------------------- */

function Architecture() {
  const pr = useReducedMotion();
  const { t } = useAppTranslation('home');

  return (
    <section className="mx-auto max-w-6xl px-6 py-24 lg:px-8 lg:py-32">
      <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <motion.div {...getFadeUp(pr)}>
          <Eyebrow>{t('architecture.eyebrow')}</Eyebrow>
          <h2 style={display} className="text-foreground mt-5 mb-4 text-[clamp(1.8rem,3.5vw,2.6rem)] leading-tight font-medium tracking-[-0.01em]">
            {t('architecture.title')}
          </h2>
          <p className="text-muted-foreground text-[15px] leading-relaxed">{t('architecture.desc')}</p>
        </motion.div>

        <motion.div {...getFadeUp(pr, 0.15)}>
          <div className="bg-code-surface shadow-spread overflow-hidden rounded-2xl" dir="ltr">
            <div className="flex items-center gap-2 px-4 py-3">
              <span className="bg-code-muted/30 h-2.5 w-2.5 rounded-full" />
              <span className="bg-code-muted/30 h-2.5 w-2.5 rounded-full" />
              <span className="bg-code-muted/30 h-2.5 w-2.5 rounded-full" />
            </div>
            <div className="px-5 pb-5 font-mono text-[13px] leading-relaxed">
              {FOLDER_TREE.map((line, i) => (
                <p key={i}>
                  <span className="text-code-foreground">{line.text}</span>
                  {line.alias && (
                    <>
                      {'  '}
                      <span className="text-primary-300">{line.alias}</span>
                    </>
                  )}
                </p>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Getting started                                                          */
/* -------------------------------------------------------------------------- */

function GettingStarted() {
  const pr = useReducedMotion();
  const { t } = useAppTranslation('home');

  return (
    <section id="getting-started" className="border-border border-t">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:px-8 lg:py-32">
        <motion.div className="mb-12 max-w-2xl" {...getFadeUp(pr)}>
          <Eyebrow>{t('gettingStarted.eyebrow')}</Eyebrow>
          <h2 style={display} className="text-foreground mt-5 text-[clamp(1.8rem,3.5vw,2.6rem)] leading-tight font-medium tracking-[-0.01em]">
            {t('gettingStarted.title')}
          </h2>
        </motion.div>

        <div className="grid gap-px overflow-hidden rounded-2xl md:grid-cols-3">
          {GETTING_STARTED_STEPS.map((step, i) => (
            <motion.div key={step.titleKey} className="border-border bg-secondary/30 border p-6" {...getFadeUp(pr, i * 0.1)}>
              <div className="mb-4 flex items-baseline gap-3">
                <span style={display} className="text-primary text-2xl font-medium">
                  {step.number}
                </span>
                <h3 className="text-foreground text-[15px] font-semibold">{t(step.titleKey)}</h3>
              </div>
              <div className="bg-code-surface overflow-x-auto rounded-lg px-4 py-3" dir="ltr">
                <code className="text-code-foreground font-mono text-[12px] whitespace-nowrap">{step.code}</code>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Footer                                                                    */
/* -------------------------------------------------------------------------- */

function Footer() {
  const { t } = useAppTranslation('home');

  return (
    <footer className="border-border bg-background border-t py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 sm:flex-row lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold">R</span>
          <p className="text-muted-foreground text-[13px]">{t('footer.builtBy')}</p>
        </div>
        <a
          href="https://github.com/mohammadsafia/rsk"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-[13px] transition-colors"
        >
          {t('footer.github')}
          <ArrowUpRight size={14} />
        </a>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function HomePage() {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <Hero />
      <TechStack />
      <Features />
      <ComponentShowcase />
      <CliSection />
      <Architecture />
      <GettingStarted />
      <Footer />
    </div>
  );
}

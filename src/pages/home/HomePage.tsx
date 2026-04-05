import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { ThemeSwitcher } from '@components/shared';

/* -------------------------------------------------------------------------- */
/*  Animation helper                                                          */
/* -------------------------------------------------------------------------- */

function getFadeUp(prefersReduced: boolean | null, delay = 0) {
  if (prefersReduced) return {};
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.5, ease: 'easeOut' as const, delay },
  };
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const STATS = [
  { value: '35', label: 'UI Components' },
  { value: '17', label: 'Form Components' },
  { value: '79', label: 'MDX Docs' },
  { value: '24', label: 'Shared Components' },
];

const FEATURES = [
  {
    title: 'Component Library',
    description:
      '35 Radix UI primitives with CVA variants. Compound component patterns \u2014 Dialog.Header, Tabs.List, Card.Content. Dark mode ready. Fully typed with TypeScript generics.',
    large: true,
  },
  {
    title: 'Form System',
    description:
      '17 form components powered by React Hook Form and Zod. Input masks, number formatting, date pickers, file uploaders, and async comboboxes with infinite scroll.',
  },
  {
    title: 'Data Tables',
    description:
      'TanStack Table with headless sorting, filtering, and pagination. Server-side query integration via custom hooks. Faceted filters out of the box.',
  },
  {
    title: 'Authentication',
    description:
      'OIDC via oidc-client-ts with Azure AD support. AuthGuard layout, route-level protection, and withAuth HOC for component-level access control.',
  },
  {
    title: 'Internationalization',
    description:
      'i18next with browser language detection. Namespace-organized translations, RTL layout support, and lazy-loaded locale bundles.',
  },
  {
    title: 'Error Monitoring',
    description:
      'Sentry integration with Vite source maps. React error boundaries with graceful fallback UI. Structured error tracking from day one.',
  },
];

const TECH_STACK = [
  {
    name: 'React',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-400">
        <ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.2" />
        <ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.2" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.2" transform="rotate(120 12 12)" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'Vite',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-400">
        <path d="M4 4L13 2L11 13L17 11L8 22L10 12L4 14L4 4Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'TypeScript',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-400">
        <rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.2" />
        <text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="bold" fontFamily="DM Sans, sans-serif">
          TS
        </text>
      </svg>
    ),
  },
  {
    name: 'Tailwind CSS',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-400">
        <path
          d="M4 12C5 8 8 6 12 6C16 6 17 8 18 10C19 12 20 14 24 14C20 14 17 16 16 18C15 16 14 14 12 14C10 14 8 16 4 16C8 16 5 14 4 12Z"
          stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: 'Radix UI',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-400">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
];

const FOLDER_TREE = [
  { text: 'src/', alias: '' },
  { text: '\u251C\u2500\u2500 api/', alias: '\u2192 @api' },
  { text: '\u251C\u2500\u2500 components/', alias: '' },
  { text: '\u2502   \u251C\u2500\u2500 ui/', alias: '\u2192 @components/ui' },
  { text: '\u2502   \u251C\u2500\u2500 forms/', alias: '\u2192 @components/forms' },
  { text: '\u2502   \u2514\u2500\u2500 shared/', alias: '\u2192 @components/shared' },
  { text: '\u251C\u2500\u2500 layouts/', alias: '\u2192 @layouts' },
  { text: '\u251C\u2500\u2500 lib/', alias: '' },
  { text: '\u2502   \u251C\u2500\u2500 hooks/', alias: '\u2192 @hooks' },
  { text: '\u2502   \u251C\u2500\u2500 utils/', alias: '\u2192 @utils' },
  { text: '\u2502   \u2514\u2500\u2500 contexts/', alias: '\u2192 @contexts' },
  { text: '\u251C\u2500\u2500 pages/', alias: '\u2192 @pages' },
  { text: '\u2514\u2500\u2500 routes/', alias: '\u2192 @routes' },
];

const GETTING_STARTED_STEPS = [
  { number: '01', title: 'Clone', code: 'git clone https://github.com/mohammadsafia/rsk.git' },
  { number: '02', title: 'Install', code: 'yarn install' },
  { number: '03', title: 'Start', code: 'yarn dev' },
];

const SIDEBAR_ITEMS = ['Button', 'Card', 'Dialog', 'Input', 'Select', 'Tabs', 'Toast'];

/* -------------------------------------------------------------------------- */
/*  Section 1: Grain Overlay                                                  */
/* -------------------------------------------------------------------------- */

function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        opacity: 0.18,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 2: Navbar                                                         */
/* -------------------------------------------------------------------------- */

function Navbar() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-300 items-center justify-between px-6 lg:px-8">
        <a href="/" className="text-sm font-bold tracking-[0.05em] text-foreground">
          RSK
        </a>

        <div className="flex items-center gap-6">
          <a href="#features" className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-400 transition-colors hover:text-foreground">
            Features
          </a>
          <a href="/components" className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-400 transition-colors hover:text-foreground">
            Components
          </a>
          <a
            href="https://github.com/mohammadsafia/rsk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-400 transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 3: Hero                                                           */
/* -------------------------------------------------------------------------- */

function Hero() {
  const pr = useReducedMotion();
  const fade = getFadeUp(pr);
  const fadeRight = getFadeUp(pr, 0.15);

  return (
    <section className="mx-auto max-w-300 px-6 pt-32 pb-20 lg:px-8 lg:pt-40 lg:pb-28">
      <div className="flex flex-col gap-12 md:flex-row md:justify-between">
        <motion.div className="max-w-2xl flex-7" {...fade}>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-400">
            REACT &middot; TYPESCRIPT &middot; VITE
          </p>
          <h1
            className="mb-5 leading-[1.1] tracking-[-0.01em] text-foreground"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 5vw, 48px)' }}
          >
            The foundation
            <br />
            for what&apos;s next.
          </h1>
          <p className="mb-8 max-w-lg text-[15px] text-muted-foreground">
            A considered starter for developers who value craft. 76 components, enterprise patterns, zero compromise.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="#getting-started"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Get Started
              <ArrowRight size={16} />
            </a>
            <a
              href="https://github.com/mohammadsafia/rsk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground underline transition-opacity hover:opacity-70"
            >
              GitHub &rarr;
            </a>
          </div>
        </motion.div>

        <motion.div className="flex flex-row gap-8 border-border md:flex-col md:gap-6 md:border-s md:ps-10" {...fadeRight}>
          {STATS.map((stat) => {
            const f = getFadeUp(pr, 0.1);
            return (
              <motion.div key={stat.label} {...f}>
                <p className="text-[32px] font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-400">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 4: Tech Stack Bar                                                 */
/* -------------------------------------------------------------------------- */

function TechStack() {
  const pr = useReducedMotion();
  const fade = getFadeUp(pr);

  return (
    <motion.section className="mx-auto max-w-300 border-y border-border px-6 py-10 lg:px-8" {...fade}>
      <div className="flex items-center justify-center gap-10 md:gap-16">
        {TECH_STACK.map((tech) => (
          <div key={tech.name} className="flex flex-col items-center gap-2">
            {tech.icon}
            <span className="text-[11px] text-muted-400">{tech.name}</span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 5: Features Grid                                                  */
/* -------------------------------------------------------------------------- */

function Features() {
  const pr = useReducedMotion();
  return (
    <section id="features" className="mx-auto max-w-300 px-6 py-20 lg:px-8 lg:py-28">
      <motion.p className="mb-8 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-400" {...getFadeUp(pr)}>
        WHAT&apos;S INSIDE
      </motion.p>

      <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
        {FEATURES.map((feature, i) => {
          const fade = getFadeUp(pr, i * 0.08);
          return (
            <motion.div
              key={feature.title}
              className={`rounded-xl border border-foreground/6 bg-foreground/2 p-6 ${feature.large ? 'md:row-span-2' : ''}`}
              {...fade}
            >
              <h3 className="mb-2 text-[15px] font-semibold text-foreground">{feature.title}</h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 6: Component Showcase                                             */
/* -------------------------------------------------------------------------- */

function ComponentShowcase() {
  const pr = useReducedMotion();
  const fadeLeft = getFadeUp(pr);
  const fadeRight = getFadeUp(pr, 0.15);

  return (
    <section className="mx-auto max-w-300 px-6 py-20 lg:px-8 lg:py-28">
      <div className="flex flex-col items-center gap-10 md:flex-row md:gap-16">
        <motion.div className="flex-4" {...fadeLeft}>
          <h2
            className="mb-4 text-foreground"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3.5vw, 36px)' }}
          >
            See what you get.
          </h2>
          <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
            79 MDX-powered documentation pages with live previews, code snippets, and usage guidelines. Browse the full gallery to explore every component.
          </p>
          <a href="/components" className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline transition-opacity hover:opacity-70">
            Open Gallery
            <ArrowRight size={16} />
          </a>
        </motion.div>

        <motion.div className="flex-6" {...fadeRight}>
          <div className="overflow-hidden rounded-xl border border-border bg-background shadow">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-muted-200" />
              <div className="h-2.5 w-2.5 rounded-full bg-muted-200" />
              <div className="h-2.5 w-2.5 rounded-full bg-muted-200" />
              <span className="ms-3 text-[11px] text-muted-400">localhost:5173/components</span>
            </div>

            <div className="flex">
              <div className="hidden w-45 border-r border-border p-4 md:block">
                <div className="mb-3 rounded-md bg-foreground/3 px-3 py-1.5 text-[11px] text-muted-400">Search...</div>
                <div className="flex flex-col gap-0.5">
                  {SIDEBAR_ITEMS.map((item, idx) => (
                    <div
                      key={item}
                      className={`rounded-md px-3 py-1.5 text-[12px] ${
                        idx === 0 ? 'bg-foreground font-medium text-background' : 'text-muted-foreground'
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 p-5">
                <h4 className="mb-1 text-[15px] font-semibold text-foreground">Button</h4>
                <p className="mb-4 text-[12px] text-muted-foreground">Displays a button or a component that looks like a button.</p>
                <div className="mb-4 h-px bg-border" />
                <div className="mb-4 flex gap-2">
                  <span className="rounded-md bg-foreground px-3 py-1.5 text-[12px] font-medium text-background">Default</span>
                  <span className="rounded-md border border-foreground/15 px-3 py-1.5 text-[12px] font-medium text-foreground">Outline</span>
                  <span className="rounded-md px-3 py-1.5 text-[12px] font-medium text-muted-foreground">Ghost</span>
                </div>
                <div className="rounded-md bg-code-surface p-3">
                  <code className="text-[11px] text-code-foreground">
                    {'<Button variant="default">Click me</Button>'}
                  </code>
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
/*  Section 7: CLI / Code Generation                                          */
/* -------------------------------------------------------------------------- */

function CliSection() {
  const pr = useReducedMotion();
  const fadeLeft = getFadeUp(pr);
  const fadeRight = getFadeUp(pr, 0.15);

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-20 lg:px-8 lg:py-28">
      <div className="flex flex-col-reverse items-center gap-10 md:flex-row md:gap-16">
        <motion.div className="flex-[55] self-stretch" {...fadeLeft}>
          <div className="h-full overflow-hidden rounded-xl bg-code-surface">
            <div className="flex items-center gap-2 px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-code-muted/30" />
              <div className="h-2.5 w-2.5 rounded-full bg-code-muted/30" />
              <div className="h-2.5 w-2.5 rounded-full bg-code-muted/30" />
            </div>
            <div className="px-5 pb-5 font-mono text-[13px] leading-relaxed">
              <p><span className="text-muted-400">$ </span><span className="text-code-foreground">npx rsk dto:gen</span></p>
              <p className="text-code-muted">&nbsp; &#10003; Fetching OpenAPI spec...</p>
              <p className="text-code-muted">&nbsp; &#10003; Parsing 42 schemas</p>
              <p className="text-code-muted">&nbsp; &#10003; Generating TypeScript DTOs</p>
              <p className="text-code-muted">&nbsp; &#10003; Formatting with Prettier</p>
              <p className="text-code-muted">&nbsp; &#10003; Written 42 files</p>
              <p className="mt-4"><span className="text-muted-400">$ </span><span className="text-code-foreground">npx rsk dto:list</span></p>
              <p className="mt-4"><span className="text-muted-400">$ </span><span className="text-code-foreground">npx rsk dto:diff</span></p>
            </div>
          </div>
        </motion.div>

        <motion.div className="flex-45" {...fadeRight}>
          <h2
            className="mb-4 text-foreground"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3.5vw, 36px)' }}
          >
            Generate, don&apos;t write.
          </h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            A 7-step pipeline fetches your OpenAPI spec, parses schemas, generates TypeScript DTOs with full type safety, formats with Prettier, and writes to disk. One command replaces hours of manual typing.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 8: Architecture                                                   */
/* -------------------------------------------------------------------------- */

function Architecture() {
  const pr = useReducedMotion();
  const fadeLeft = getFadeUp(pr);
  const fadeRight = getFadeUp(pr, 0.15);

  return (
    <section className="mx-auto max-w-300 px-6 py-20 lg:px-8 lg:py-28">
      <div className="flex flex-col items-center gap-10 md:flex-row md:gap-16">
        <motion.div className="flex-45" {...fadeLeft}>
          <h2
            className="mb-4 text-foreground"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3.5vw, 36px)' }}
          >
            Organized by design.
          </h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            15 path aliases keep imports clean and refactoring painless. Every folder has a purpose, every alias has a convention. No guessing where things live.
          </p>
        </motion.div>

        <motion.div className="flex-55 self-stretch" {...fadeRight}>
          <div className="h-full overflow-hidden rounded-xl bg-code-surface">
            <div className="flex items-center gap-2 px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-code-muted/30" />
              <div className="h-2.5 w-2.5 rounded-full bg-code-muted/30" />
              <div className="h-2.5 w-2.5 rounded-full bg-code-muted/30" />
            </div>
            <div className="px-5 pb-5 font-mono text-[13px] leading-relaxed">
              {FOLDER_TREE.map((line, i) => (
                <p key={i}>
                  <span className="text-code-foreground">{line.text}</span>
                  {line.alias && (
                    <>{'  '}<span className="text-code-muted">{line.alias}</span></>
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
/*  Section 9: Getting Started                                                */
/* -------------------------------------------------------------------------- */

function GettingStarted() {
  const pr = useReducedMotion();
  const fade = getFadeUp(pr);

  return (
    <section id="getting-started" className="bg-secondary py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <motion.h2
          className="mb-10 text-center text-foreground"
          style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3.5vw, 36px)' }}
          {...fade}
        >
          Get started in seconds.
        </motion.h2>

        <div className="grid gap-6 md:grid-cols-3">
          {GETTING_STARTED_STEPS.map((step, i) => {
            const f = getFadeUp(pr, i * 0.1);
            return (
              <motion.div key={step.title} {...f}>
                <p className="mb-2 text-[40px] font-bold text-foreground/10" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {step.number}
                </p>
                <h3 className="mb-3 text-[15px] font-semibold text-foreground">{step.title}</h3>
                <div className="overflow-x-auto rounded-lg bg-code-surface px-4 py-3">
                  <code className="whitespace-nowrap font-mono text-[12px] text-code-foreground">{step.code}</code>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 10: Footer                                                        */
/* -------------------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-border bg-background py-10">
      <div className="mx-auto flex max-w-300 items-center justify-between px-6 lg:px-8">
        <p className="text-[13px] text-muted-400">Built by Mohammad Safia</p>
        <a
          href="https://github.com/mohammadsafia/rsk"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-400 transition-colors hover:text-foreground"
        >
          GitHub
          <ExternalLink size={13} />
        </a>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <GrainOverlay />
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

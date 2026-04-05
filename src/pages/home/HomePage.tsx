import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ExternalLink } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Animation helper                                                          */
/* -------------------------------------------------------------------------- */

function useFadeUp(delay = 0) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return {};
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.5, ease: 'easeOut', delay },
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
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#8a7a68" strokeWidth="1.2" />
        <ellipse
          cx="12"
          cy="12"
          rx="10"
          ry="4"
          stroke="#8a7a68"
          strokeWidth="1.2"
          transform="rotate(60 12 12)"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="10"
          ry="4"
          stroke="#8a7a68"
          strokeWidth="1.2"
          transform="rotate(120 12 12)"
        />
        <circle cx="12" cy="12" r="2" fill="#8a7a68" />
      </svg>
    ),
  },
  {
    name: 'Vite',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M4 4L13 2L11 13L17 11L8 22L10 12L4 14L4 4Z" stroke="#8a7a68" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'TypeScript',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="3" stroke="#8a7a68" strokeWidth="1.2" />
        <text x="12" y="16" textAnchor="middle" fill="#8a7a68" fontSize="10" fontWeight="bold" fontFamily="DM Sans, sans-serif">
          TS
        </text>
      </svg>
    ),
  },
  {
    name: 'Tailwind CSS',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 12C5 8 8 6 12 6C16 6 17 8 18 10C19 12 20 14 24 14C20 14 17 16 16 18C15 16 14 14 12 14C10 14 8 16 4 16C8 16 5 14 4 12Z"
          stroke="#8a7a68"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: 'Radix UI',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke="#8a7a68" strokeWidth="1.2" />
        <circle cx="12" cy="12" r="9" stroke="#8a7a68" strokeWidth="1.2" />
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
  { number: '01', title: 'Clone', code: 'git clone https://github.com/user/rsk.git' },
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
    <nav
      className="fixed top-0 right-0 left-0 z-40 bg-[#faf9f7]/80 backdrop-blur-md"
      style={{ borderBottom: '1px solid rgba(26,22,18,0.08)' }}
    >
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6 lg:px-8">
        <a
          href="/"
          className="text-sm font-bold tracking-[0.05em] text-[#1a1612]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          RSK
        </a>

        <div className="flex items-center gap-6">
          <a
            href="#features"
            className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a7a68] transition-colors hover:text-[#1a1612]"
          >
            Features
          </a>
          <a
            href="/components"
            className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a7a68] transition-colors hover:text-[#1a1612]"
          >
            Components
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a7a68] transition-colors hover:text-[#1a1612]"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 3: Hero                                                           */
/* -------------------------------------------------------------------------- */

function Hero() {
  const fade = useFadeUp();
  const fadeRight = useFadeUp(0.15);

  return (
    <section className="mx-auto max-w-[1200px] px-6 pt-32 pb-20 lg:px-8 lg:pt-40 lg:pb-28">
      <div className="flex flex-col gap-12 md:flex-row md:justify-between">
        {/* Left column */}
        <motion.div className="max-w-2xl flex-[7]" {...fade}>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#b8a080]">
            REACT &middot; TYPESCRIPT &middot; VITE
          </p>
          <h1
            className="mb-5 leading-[1.1] tracking-[-0.01em] text-[#1a1612]"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(32px, 5vw, 48px)',
            }}
          >
            The foundation
            <br />
            for what&apos;s next.
          </h1>
          <p className="mb-8 max-w-lg text-[15px] text-[#8a7a68]">
            A considered starter for developers who value craft. 76 components, enterprise patterns,
            zero compromise.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="#getting-started"
              className="inline-flex items-center gap-2 rounded-lg bg-[#1a1612] px-5 py-2.5 text-sm font-medium text-[#faf9f7] transition-opacity hover:opacity-90"
            >
              Get Started
              <ArrowRight size={16} />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[#1a1612] underline transition-opacity hover:opacity-70"
            >
              GitHub &rarr;
            </a>
          </div>
        </motion.div>

        {/* Right column — Stats */}
        <motion.div
          className="flex flex-row gap-8 md:flex-col md:gap-6 md:border-l md:pl-10"
          style={{ borderColor: 'rgba(26,22,18,0.08)' }}
          {...fadeRight}
        >
          {STATS.map((stat) => {
            const f = useFadeUp(0.1);
            return (
              <motion.div key={stat.label} {...f}>
                <p
                  className="text-[32px] font-bold text-[#1a1612]"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {stat.value}
                </p>
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#b8a080]">
                  {stat.label}
                </p>
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
  const fade = useFadeUp();

  return (
    <motion.section
      className="mx-auto max-w-[1200px] px-6 py-10 lg:px-8"
      style={{ borderTop: '1px solid rgba(26,22,18,0.08)', borderBottom: '1px solid rgba(26,22,18,0.08)' }}
      {...fade}
    >
      <div className="flex items-center justify-center gap-10 md:gap-16">
        {TECH_STACK.map((tech) => (
          <div key={tech.name} className="flex flex-col items-center gap-2">
            {tech.icon}
            <span className="text-[11px] text-[#8a7a68]">{tech.name}</span>
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
  return (
    <section id="features" className="mx-auto max-w-[1200px] px-6 py-20 lg:px-8 lg:py-28">
      <motion.p
        className="mb-8 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#b8a080]"
        {...useFadeUp()}
      >
        WHAT&apos;S INSIDE
      </motion.p>

      <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
        {FEATURES.map((feature, i) => {
          const fade = useFadeUp(i * 0.08);
          return (
            <motion.div
              key={feature.title}
              className={`rounded-xl p-6 ${feature.large ? 'md:row-span-2' : ''}`}
              style={{
                border: '1px solid rgba(26,22,18,0.06)',
                background: 'rgba(26,22,18,0.02)',
              }}
              {...fade}
            >
              <h3
                className="mb-2 text-[15px] font-semibold text-[#1a1612]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {feature.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-[#8a7a68]">{feature.description}</p>
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
  const fadeLeft = useFadeUp();
  const fadeRight = useFadeUp(0.15);

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-20 lg:px-8 lg:py-28">
      <div className="flex flex-col items-center gap-10 md:flex-row md:gap-16">
        {/* Left text */}
        <motion.div className="flex-[4]" {...fadeLeft}>
          <h2
            className="mb-4 text-[#1a1612]"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(24px, 3.5vw, 36px)',
            }}
          >
            See what you get.
          </h2>
          <p className="mb-6 text-[15px] leading-relaxed text-[#8a7a68]">
            79 MDX-powered documentation pages with live previews, code snippets, and usage
            guidelines. Browse the full gallery to explore every component.
          </p>
          <a
            href="/components"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1a1612] underline transition-opacity hover:opacity-70"
          >
            Open Gallery
            <ArrowRight size={16} />
          </a>
        </motion.div>

        {/* Right mockup */}
        <motion.div className="flex-[6]" {...fadeRight}>
          <div
            className="overflow-hidden rounded-xl bg-white shadow"
            style={{ border: '1px solid rgba(26,22,18,0.08)' }}
          >
            {/* Browser chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: '1px solid rgba(26,22,18,0.08)' }}
            >
              <div className="h-2.5 w-2.5 rounded-full bg-[#e8e0d4]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#e8e0d4]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#e8e0d4]" />
              <span className="ml-3 text-[11px] text-[#b8a080]">localhost:5173/components</span>
            </div>

            <div className="flex">
              {/* Sidebar */}
              <div
                className="hidden w-[180px] p-4 md:block"
                style={{ borderRight: '1px solid rgba(26,22,18,0.08)' }}
              >
                <div
                  className="mb-3 rounded-md px-3 py-1.5 text-[11px] text-[#b8a080]"
                  style={{ background: 'rgba(26,22,18,0.03)' }}
                >
                  Search...
                </div>
                <div className="flex flex-col gap-0.5">
                  {SIDEBAR_ITEMS.map((item, idx) => (
                    <div
                      key={item}
                      className={`rounded-md px-3 py-1.5 text-[12px] ${
                        idx === 0
                          ? 'bg-[#1a1612] font-medium text-[#faf9f7]'
                          : 'text-[#8a7a68]'
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main panel */}
              <div className="flex-1 p-5">
                <h4
                  className="mb-1 text-[15px] font-semibold text-[#1a1612]"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Button
                </h4>
                <p className="mb-4 text-[12px] text-[#8a7a68]">
                  Displays a button or a component that looks like a button.
                </p>
                <div
                  className="mb-4"
                  style={{ height: '1px', background: 'rgba(26,22,18,0.08)' }}
                />
                <div className="mb-4 flex gap-2">
                  <span className="rounded-md bg-[#1a1612] px-3 py-1.5 text-[12px] font-medium text-[#faf9f7]">
                    Default
                  </span>
                  <span
                    className="rounded-md px-3 py-1.5 text-[12px] font-medium text-[#1a1612]"
                    style={{ border: '1px solid rgba(26,22,18,0.15)' }}
                  >
                    Outline
                  </span>
                  <span className="rounded-md px-3 py-1.5 text-[12px] font-medium text-[#8a7a68]">
                    Ghost
                  </span>
                </div>
                <div className="rounded-md bg-[#1e1b18] p-3">
                  <code className="text-[11px] text-[#e8dfd4]">
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
  const fadeLeft = useFadeUp();
  const fadeRight = useFadeUp(0.15);

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-20 lg:px-8 lg:py-28">
      <div className="flex flex-col-reverse items-center gap-10 md:flex-row md:gap-16">
        {/* Left — terminal */}
        <motion.div className="flex-[55] self-stretch" {...fadeLeft}>
          <div className="h-full overflow-hidden rounded-xl bg-[#1e1b18]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-[#3a3530]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#3a3530]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#3a3530]" />
            </div>
            <div className="px-5 pb-5 font-mono text-[13px] leading-relaxed">
              <p>
                <span className="text-[#b8a080]">$ </span>
                <span className="text-[#e8dfd4]">npx rsk dto:gen</span>
              </p>
              <p className="text-[#6b5f50]">&nbsp; &#10003; Fetching OpenAPI spec...</p>
              <p className="text-[#6b5f50]">&nbsp; &#10003; Parsing 42 schemas</p>
              <p className="text-[#6b5f50]">&nbsp; &#10003; Generating TypeScript DTOs</p>
              <p className="text-[#6b5f50]">&nbsp; &#10003; Formatting with Prettier</p>
              <p className="text-[#6b5f50]">&nbsp; &#10003; Written 42 files</p>
              <p className="mt-4">
                <span className="text-[#b8a080]">$ </span>
                <span className="text-[#e8dfd4]">npx rsk dto:list</span>
              </p>
              <p className="mt-4">
                <span className="text-[#b8a080]">$ </span>
                <span className="text-[#e8dfd4]">npx rsk dto:diff</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right — text */}
        <motion.div className="flex-[45]" {...fadeRight}>
          <h2
            className="mb-4 text-[#1a1612]"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(24px, 3.5vw, 36px)',
            }}
          >
            Generate, don&apos;t write.
          </h2>
          <p className="text-[15px] leading-relaxed text-[#8a7a68]">
            A 7-step pipeline fetches your OpenAPI spec, parses schemas, generates TypeScript DTOs
            with full type safety, formats with Prettier, and writes to disk. One command replaces
            hours of manual typing.
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
  const fadeLeft = useFadeUp();
  const fadeRight = useFadeUp(0.15);

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-20 lg:px-8 lg:py-28">
      <div className="flex flex-col items-center gap-10 md:flex-row md:gap-16">
        {/* Left — text */}
        <motion.div className="flex-[45]" {...fadeLeft}>
          <h2
            className="mb-4 text-[#1a1612]"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(24px, 3.5vw, 36px)',
            }}
          >
            Organized by design.
          </h2>
          <p className="text-[15px] leading-relaxed text-[#8a7a68]">
            15 path aliases keep imports clean and refactoring painless. Every folder has a purpose,
            every alias has a convention. No guessing where things live.
          </p>
        </motion.div>

        {/* Right — folder tree */}
        <motion.div className="flex-[55] self-stretch" {...fadeRight}>
          <div className="h-full overflow-hidden rounded-xl bg-[#1e1b18]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-[#3a3530]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#3a3530]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#3a3530]" />
            </div>
            <div className="px-5 pb-5 font-mono text-[13px] leading-relaxed">
              {FOLDER_TREE.map((line, i) => (
                <p key={i}>
                  <span className="text-[#e8dfd4]">{line.text}</span>
                  {line.alias && (
                    <>
                      {'  '}
                      <span className="text-[#6b5f50]">{line.alias}</span>
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
/*  Section 9: Getting Started                                                */
/* -------------------------------------------------------------------------- */

function GettingStarted() {
  const fade = useFadeUp();

  return (
    <section id="getting-started" className="bg-[#f5f0eb] py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <motion.h2
          className="mb-10 text-center text-[#1a1612]"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(24px, 3.5vw, 36px)',
          }}
          {...fade}
        >
          Get started in seconds.
        </motion.h2>

        <div className="grid gap-6 md:grid-cols-3">
          {GETTING_STARTED_STEPS.map((step, i) => {
            const f = useFadeUp(i * 0.1);
            return (
              <motion.div key={step.title} {...f}>
                <p
                  className="mb-2 text-[40px] font-bold text-[#1a1612]/10"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {step.number}
                </p>
                <h3
                  className="mb-3 text-[15px] font-semibold text-[#1a1612]"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {step.title}
                </h3>
                <div className="overflow-x-auto rounded-lg bg-[#1e1b18] px-4 py-3">
                  <code className="whitespace-nowrap font-mono text-[12px] text-[#e8dfd4]">
                    {step.code}
                  </code>
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
    <footer
      className="bg-[#faf9f7] py-10"
      style={{ borderTop: '1px solid rgba(26,22,18,0.08)' }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 lg:px-8">
        <p className="text-[13px] text-[#b8a080]">Built by Mohammad Safia</p>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[13px] text-[#8a7a68] transition-colors hover:text-[#1a1612]"
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
    <div className="min-h-screen bg-[#faf9f7]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
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

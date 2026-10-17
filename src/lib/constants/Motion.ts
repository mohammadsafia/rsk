/** The motion scale (spec docs/superpowers/specs/2026-10-17-motion-design.md §1). Mirrored in src/styles/tokens.css. */
export const MOTION_DURATIONS = {
  instant: 100,
  fast: 120,
  base: 180,
  exit: 200,
  slow: 260,
  spring: 380,
  springLong: 420,
  roll: 520,
} as const;

export const MOTION_STAGGER = { cascade: 32, reveal: 60 } as const;

export const MOTION_EASINGS = {
  out: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  spring: 'cubic-bezier(0.34, 1.32, 0.64, 1)',
} as const;

export const MOTION_DISTANCES = { nudge: 4, rise: 8, slide: 16, popScale: 0.96, settleScale: 0.98, depth: 0.025 } as const;

/** Matches Tooltip.Provider delayDuration in src/bootstrap.tsx. */
export const TOOLTIP_DELAY = 300;

export const MOTION = {
  durations: MOTION_DURATIONS,
  stagger: MOTION_STAGGER,
  easings: MOTION_EASINGS,
  distances: MOTION_DISTANCES,
} as const;

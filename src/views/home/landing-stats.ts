export type LandingCounts = { ui: number; forms: number; shared: number; total: number };

/**
 * Baked in at build time from the docs frontmatter (scripts/docs/doc-counts.ts). The landing must not
 * import the docs registry: its eager MDX globs would pull every docs page into the production bundle.
 */
export const LANDING_COUNTS: LandingCounts = __RSK_DOC_COUNTS__;

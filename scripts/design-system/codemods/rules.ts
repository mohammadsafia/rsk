import type { TagRule } from './migrate-props';

/** Rule sets applied with `pnpm ds:migrate <set>`. Each Plan A task adds its set. */
export const RULE_SETS: Record<string, ReadonlyArray<TagRule>> = {};

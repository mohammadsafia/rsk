import { describe, expect, it } from 'vite-plus/test';

import { DURATIONS } from '../../src/lib/constants/DesignTokens';
import { MOTION_DISTANCES, MOTION_DURATIONS, MOTION_EASINGS, MOTION_STAGGER } from '../../src/lib/constants/Motion';
import { extractBlock, readProjectFile } from './css-tokens';

const tokensCss = readProjectFile('src/styles/tokens.css');
const themeCss = readProjectFile('src/styles/theme.css');
const utilitiesCss = readProjectFile('src/styles/utilities.css');
const indexCss = readProjectFile('src/index.css');
const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

describe('motion tokens', () => {
  const root = extractBlock(tokensCss, ':root');

  it('mirrors every duration in tokens.css', () => {
    for (const [name, ms] of Object.entries(MOTION_DURATIONS)) expect(root[`duration-${kebab(name)}`], name).toBe(`${ms}ms`);
  });

  it('mirrors stagger and depth', () => {
    expect(root['motion-stagger']).toBe(`${MOTION_STAGGER.cascade}ms`);
    expect(root['motion-reveal-stagger']).toBe(`${MOTION_STAGGER.reveal}ms`);
    expect(root['motion-depth']).toBe(String(MOTION_DISTANCES.depth));
    expect(root['motion-ease-spring']).toBe(MOTION_EASINGS.spring);
  });

  it('exposes the easings to Tailwind, the spring through a variable the modes can swap', () => {
    expect(themeCss).toContain(`--ease-out: ${MOTION_EASINGS.out};`);
    expect(themeCss).toContain(`--ease-in: ${MOTION_EASINGS.in};`);
    expect(themeCss).toContain('--ease-spring: var(--motion-ease-spring);');
  });

  it('declares a duration utility for every token and lists it in DURATIONS', () => {
    for (const name of Object.keys(MOTION_DURATIONS)) {
      expect(utilitiesCss).toContain(`@utility duration-${kebab(name)} {`);
      expect(DURATIONS.map((step) => step.token)).toContain(`duration-${kebab(name)}`);
    }
  });

  it('calm mode removes overshoot, stagger and depth', () => {
    const motionCss = readProjectFile('src/styles/motion.css');
    const calm = motionCss.slice(motionCss.indexOf(":root[data-motion='calm'] {"));
    expect(calm).toContain('--motion-ease-spring: var(--ease-out);');
    expect(calm).toContain('--motion-stagger: 0ms;');
    expect(calm).toContain('--motion-reveal-stagger: 0ms;');
    expect(calm).toContain('--motion-depth: 0;');
  });

  it('imports motion.css after utilities.css', () => {
    expect(indexCss.indexOf("@import './styles/motion.css';")).toBeGreaterThan(indexCss.indexOf("@import './styles/utilities.css';"));
  });

  it("points the bare transition-* utilities at the motion tokens instead of Tailwind's 150ms default", () => {
    expect(themeCss).toContain('--default-transition-duration: var(--duration-fast);');
    expect(themeCss).toContain(`--default-transition-timing-function: ${MOTION_EASINGS.out};`);
  });
});

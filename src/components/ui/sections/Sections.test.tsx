// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { SectionMarker, Sections, SectionsReset } from '@components/ui';

afterEach(cleanup);

const markers = () => Array.from(document.querySelectorAll<HTMLElement>('[data-slot="section-marker"]'));

describe('SectionMarker', () => {
  it('outside Sections, marks a single titled block with §', () => {
    render(<SectionMarker />);
    const [marker] = markers();
    expect(marker.dataset.kind).toBe('section');
    expect(marker.textContent).toBe('§');
    expect(marker.className).toContain('section-mark');
    expect(marker.getAttribute('aria-hidden')).toBe('true');
  });

  it('inside Sections, renders an empty counter marker for each child (CSS supplies 01, 02, …)', () => {
    render(
      <Sections>
        <h2>
          <SectionMarker />
          Details
        </h2>
        <h2>
          <SectionMarker />
          Contact
        </h2>
      </Sections>,
    );
    expect(document.querySelector('[data-slot="sections"]')?.className).toContain('sections');
    expect(markers().map((marker) => [marker.dataset.kind, marker.textContent, marker.className.includes('section-number')])).toEqual([
      ['number', '', true],
      ['number', '', true],
    ]);
  });

  it('renders nothing with marker={false}, and § when forced', () => {
    render(
      <Sections>
        <SectionMarker marker={false} />
        <SectionMarker marker="§" />
      </Sections>,
    );
    expect(markers().map((marker) => marker.dataset.kind)).toEqual(['section']);
  });

  it('SectionsReset makes portalled content count as outside the group', () => {
    render(
      <Sections>
        <SectionsReset>
          <SectionMarker />
        </SectionsReset>
      </Sections>,
    );
    expect(markers()[0].dataset.kind).toBe('section');
  });

  it('nested Sections get their own counter-reset element', () => {
    render(
      <Sections>
        <Sections>
          <SectionMarker />
        </Sections>
      </Sections>,
    );
    expect(document.querySelectorAll('[data-slot="sections"]')).toHaveLength(2);
  });
});

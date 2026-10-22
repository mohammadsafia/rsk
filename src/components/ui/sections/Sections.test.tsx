// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { SectionMarker, Sections, SectionsReset } from '@components/ui';
import { renderWithKitRouter } from '../../../lib/contexts/testing';

afterEach(cleanup);

const markers = () => Array.from(document.querySelectorAll<HTMLElement>('[data-slot="section-marker"]'));

describe('SectionMarker', () => {
  it('outside Sections, renders no marker at all', () => {
    render(<SectionMarker />);
    expect(markers()).toEqual([]);
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

  it('renders nothing with marker={false}, even inside Sections', () => {
    render(
      <Sections>
        <SectionMarker marker={false} />
      </Sections>,
    );
    expect(markers()).toEqual([]);
  });

  it('SectionsReset makes portalled content count as outside the group (no stray 01)', () => {
    render(
      <Sections>
        <SectionsReset>
          <SectionMarker />
        </SectionsReset>
      </Sections>,
    );
    expect(markers()).toEqual([]);
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

  it('reveals its sections on the first visit to a route in a session, never again', () => {
    sessionStorage.clear();
    const { unmount } = render(
      <Sections>
        <section>One</section>
      </Sections>,
    );
    expect(document.querySelector('[data-slot="sections"]')?.className).toContain('reveal');
    unmount();
    render(
      <Sections>
        <section>One</section>
      </Sections>,
    );
    expect(document.querySelector('[data-slot="sections"]')?.hasAttribute('data-reveal')).toBe(false);
  });

  it('counts a route once, whatever its parameters: a second patient profile does not replay the reveal', () => {
    sessionStorage.clear();
    const at = (path: string) =>
      renderWithKitRouter(
        <Sections>
          <section>One</section>
        </Sections>,
        { initialPath: path, pattern: '/patients/:id' },
      );
    const first = at('/patients/dr-haddad');
    expect(document.querySelector('[data-slot="sections"]')?.hasAttribute('data-reveal')).toBe(true);
    first.unmount();
    at('/patients/dr-khalil');
    expect(document.querySelector('[data-slot="sections"]')?.hasAttribute('data-reveal')).toBe(false);
  });
});

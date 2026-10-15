import type { ReactNode } from 'react';

import { cn } from '@utils';

import { CONTROL_SIZES, DURATIONS, ELEVATIONS, RADIUS_SCALE, STATE_UTILITIES } from '@constants';

type ScaleSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
};

const ScaleSection = ({ id, title, children }: ScaleSectionProps) => (
  <section data-slot="foundation-scale-section" data-section={id} className="grid gap-3">
    <h3 className="text-md font-semibold">{title}</h3>

    {children}
  </section>
);

const RADIUS_CLASS: Record<string, string> = { 'radius-sm': 'rounded-sm', 'radius-md': 'rounded-md', 'radius-lg': 'rounded-lg' };

const HEIGHT_CLASS: Record<string, string> = { 'control-sm': 'h-control-sm', 'control-md': 'h-control-md', 'control-lg': 'h-control-lg' };

const FoundationScales = () => (
  <div data-slot="foundation-scales" className="grid gap-8">
    <ScaleSection id="radius" title="Radius">
      <div className="flex flex-wrap gap-4">
        {RADIUS_SCALE.map((step) => (
          <figure key={step.token} className="grid gap-1">
            <span className={cn(RADIUS_CLASS[step.token], 'bg-surface border-border-strong size-16 border')} />

            <figcaption className="text-fg-muted font-mono text-xs">{step.token}</figcaption>
          </figure>
        ))}
      </div>
    </ScaleSection>

    <ScaleSection id="control-size" title="Control sizes">
      <div className="flex flex-wrap items-end gap-3">
        {CONTROL_SIZES.map((size) => (
          <span
            key={size.token}
            className={cn(HEIGHT_CLASS[size.token], 'bg-inverse text-inverse-fg inline-flex items-center rounded-md px-3 text-sm')}
          >
            {size.use}
          </span>
        ))}
      </div>
    </ScaleSection>

    <ScaleSection id="elevation" title="Elevation">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-surface border-border rounded-lg border p-4 text-sm">Resting — border only</div>

        {ELEVATIONS.map((elevation) => (
          <div key={elevation.token} className={cn(elevation.token, 'bg-surface-raised rounded-lg p-4 text-sm')}>
            {elevation.use}
          </div>
        ))}
      </div>
    </ScaleSection>

    <ScaleSection id="motion" title="Motion">
      <ul className="grid gap-1 text-sm">
        {DURATIONS.map((duration) => (
          <li key={duration.token}>
            <code className="font-mono text-xs">{duration.token}</code> · {duration.value} ·{' '}
            <span className="text-fg-muted">{duration.use}</span>
          </li>
        ))}
      </ul>
    </ScaleSection>

    <ScaleSection id="states" title="Interaction states">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="focus-ring state-press bg-inverse text-inverse-fg hover:bg-inverse-hover active:bg-inverse-pressed h-control-md rounded-md px-3 text-sm"
        >
          Press or tab to me
        </button>

        <input
          aria-label="Focus demo"
          placeholder="Focus me"
          className="focus-ring-input border-border-strong bg-surface placeholder:text-fg-muted h-control-md rounded-md border px-3 text-sm"
        />

        <input
          aria-label="Invalid demo"
          aria-invalid="true"
          defaultValue="2981-44"
          className="state-invalid border-border-strong bg-surface h-control-md rounded-md border px-3 text-sm"
        />

        <span className="text-danger text-xs">ID must be 10 digits</span>
      </div>

      <ul className="text-fg-muted grid gap-1 text-xs">
        {STATE_UTILITIES.map((utility) => (
          <li key={utility.token}>
            <code className="text-fg font-mono">{utility.token}</code> — {utility.value} · {utility.use}
          </li>
        ))}
      </ul>
    </ScaleSection>
  </div>
);

export default FoundationScales;

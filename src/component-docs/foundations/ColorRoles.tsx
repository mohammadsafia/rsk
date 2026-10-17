import { cn } from '@utils';

import { SEMANTIC_COLOR_ROLES } from '@constants';

const MODES = ['light', 'dark'] as const;

const ColorRoles = () => (
  <div data-slot="color-roles" className="grid gap-4 md:grid-cols-2">
    {MODES.map((mode) => (
      <section key={mode} data-slot="color-roles-panel" className={cn(mode, 'bg-canvas text-fg border-border rounded-lg border p-4')}>
        <h3 className="text-fg-muted mb-3 text-xs font-medium capitalize">{mode}</h3>

        <ul className="grid gap-2">
          {SEMANTIC_COLOR_ROLES.map((role) => (
            <li key={role.token} className="flex items-center gap-3">
              <span
                data-slot="color-role-swatch"
                className="border-border size-8 shrink-0 rounded-md border"
                style={{ background: `var(--${role.token})` }}
              />

              <span className="min-w-0">
                <code className="block font-mono text-xs">{role.token}</code>

                <span className="text-fg-muted block text-xs">{role.description}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    ))}
  </div>
);

export default ColorRoles;

import { TEXT_SCALE } from '@constants';

const TypeScale = () => (
  <div data-slot="type-scale" className="divide-border-subtle divide-y">
    {TEXT_SCALE.map((step) => (
      <div key={step.token} data-slot="type-scale-row" className="grid gap-2 py-3 md:grid-cols-[10rem_1fr_1fr] md:items-baseline">
        <span className="text-fg-muted font-mono text-xs">
          {step.token} · {step.px}px
        </span>

        <span className={step.token}>Patient records — 2981-4410-22</span>

        <span dir="rtl" className={step.token}>
          سجلات المرضى — <span dir="ltr">2981-4410-22</span>
        </span>
      </div>
    ))}
  </div>
);

export default TypeScale;

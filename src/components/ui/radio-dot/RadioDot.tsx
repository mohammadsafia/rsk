import { type FC } from 'react';

import { cn } from '@utils';

import { Check } from 'lucide-react';

type RadioDotProps = {
  checked?: boolean;
  className?: string;
};

const RadioDot: FC<RadioDotProps> = ({ checked, className }) => (
  <span
    data-slot="radio-dot"
    className={cn(
      'border-muted-200 bg-background flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-[color,box-shadow]',
      checked && 'border-primary bg-primary text-primary-foreground',
      className,
    )}
  >
    <Check size={14} className={cn('transition-opacity', checked ? 'opacity-100' : 'opacity-0')} />
  </span>
);

RadioDot.displayName = 'RadioDot';

export default RadioDot;

import { type ComponentProps, type FC, type RefCallback } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@utils';

type CheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root> & {
  ref?: RefCallback<HTMLButtonElement>;
};

const Checkbox: FC<CheckboxProps> = ({ ref, className, ...props }: CheckboxProps) => (
  <CheckboxPrimitive.Root
    ref={(el) => ref?.(el)}
    data-slot="checkbox"
    className={cn(
      'peer border-muted-200 bg-background h-6 w-6 shrink-0 rounded border outline-none',
      'data-[state=checked]:border-secondary data-[state=checked]:bg-secondary data-[state=checked]:text-white',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'disabled:data-[state=checked]:bg-muted-400 disabled:data-[state=checked]:border-muted-400',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="flex items-center justify-center text-current">
      <Check size={16} strokeWidth={2.5} stroke="white" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;

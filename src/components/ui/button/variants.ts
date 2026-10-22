import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent font-medium whitespace-nowrap select-none',
    'focus-ring state-press [&_svg]:size-4 [&_svg]:shrink-0',
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        solid: '',
        outline: 'bg-transparent',
        ghost: 'bg-transparent',
        link: 'h-auto! px-0! underline-offset-4 hover:underline',
      },
      tone: {
        neutral: '',
        accent: '',
        danger: '',
      },
      size: {
        sm: 'h-control-sm px-2.5 text-xs',
        md: 'h-control-md px-3 text-sm',
        lg: 'h-control-lg px-4 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'solid', tone: 'neutral', className: 'bg-fg text-fg-inverse hover:bg-fg-hover active:bg-fg-pressed' },
      { variant: 'solid', tone: 'accent', className: 'bg-accent text-accent-fg hover:bg-accent-hover' },
      { variant: 'solid', tone: 'danger', className: 'bg-danger text-danger-fg hover:bg-danger-hover' },
      { variant: 'outline', tone: 'neutral', className: 'border-border-strong text-fg hover:bg-hover' },
      { variant: 'outline', tone: 'accent', className: 'border-accent text-accent hover:bg-hover' },
      { variant: 'outline', tone: 'danger', className: 'border-danger text-danger hover:bg-hover' },
      {
        variant: 'ghost',
        tone: 'neutral',
        className: 'text-fg-muted hover:bg-hover hover:text-fg underline decoration-border-strong underline-offset-4',
      },
      { variant: 'ghost', tone: 'accent', className: 'text-accent hover:bg-hover' },
      { variant: 'ghost', tone: 'danger', className: 'text-danger hover:bg-hover' },
      { variant: 'link', tone: 'neutral', className: 'text-fg' },
      { variant: 'link', tone: 'accent', className: 'text-accent' },
      { variant: 'link', tone: 'danger', className: 'text-danger' },
    ],
    defaultVariants: {
      variant: 'solid',
      tone: 'neutral',
      size: 'md',
      fullWidth: false,
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

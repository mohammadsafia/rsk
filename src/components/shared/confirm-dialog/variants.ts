import { cva } from 'class-variance-authority';

export const confirmDialogIconVariants = cva('mb-4', {
  variants: {
    tone: {
      warning: 'text-warning',
      success: 'text-success',
      danger: 'text-danger',
      info: 'text-info',
    },
  },
  defaultVariants: {
    tone: 'danger',
  },
});

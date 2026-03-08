import type { SVGProps } from 'react';

import { cn } from '@utils';

type SortIconProps = Omit<SVGProps<SVGSVGElement>, 'direction'> & {
  direction?: 'asc' | 'desc' | false;
};

export default function SortIcon({ direction, className, ...props }: SortIconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      {...props}
    >
      <path
        d="M8 3L11 6.5H5L8 3Z"
        fill="currentColor"
        className={cn('transition-opacity', direction === 'asc' ? 'opacity-100' : 'opacity-30')}
      />
      <path
        d="M8 13L5 9.5H11L8 13Z"
        fill="currentColor"
        className={cn('transition-opacity', direction === 'desc' ? 'opacity-100' : 'opacity-30')}
      />
    </svg>
  );
}

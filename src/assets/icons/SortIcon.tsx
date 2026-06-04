import type { SVGProps } from 'react';

import type { SortDirection } from '@tanstack/react-table';

import { Conditional } from '@components/utils';

type SortIconProps = Omit<SVGProps<SVGSVGElement>, 'direction'> & {
  direction: false | SortDirection;
};

function SortIcon({ direction, ...props }: SortIconProps) {
  return (
    <span className="inline-flex flex-col items-center justify-center gap-0.5">
      <Conditional>
        <Conditional.If condition={direction === 'asc'}>
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M4 0L7.4641 6H0.535898L4 0Z" className="fill-primary-700" />
          </svg>

          <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6L0.535898 0L7.4641 0L4 6Z" className="fill-primary-50" />
          </svg>
        </Conditional.If>

        <Conditional.If condition={direction === 'desc'}>
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M4 0L7.4641 6H0.535898L4 0Z" className="fill-primary-50" />
          </svg>

          <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6L0.535898 0L7.4641 0L4 6Z" className="fill-primary-700" />
          </svg>
        </Conditional.If>

        <Conditional.Else>
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M4 0L7.4641 6H0.535898L4 0Z" className="fill-primary-50" />
          </svg>

          <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6L0.535898 0L7.4641 0L4 6Z" className="fill-primary-50" />
          </svg>
        </Conditional.Else>
      </Conditional>
    </span>
  );
}

export default SortIcon;

import type { SVGProps } from 'react';

function BillIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M3.67188 2.5V14.47C3.67188 15.45 4.13187 16.38 4.92188 16.97L10.1319 20.87C11.2419 21.7 12.7719 21.7 13.8819 20.87L19.0919 16.97C19.8819 16.38 20.3419 15.45 20.3419 14.47V2.5H3.67188Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
      />
      <path d="M2 2.5H22" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" />
      <path d="M8 8H16" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 13H16" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default BillIcon;

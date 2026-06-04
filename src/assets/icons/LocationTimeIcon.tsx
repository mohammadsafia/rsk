import type { SVGProps } from 'react';

function LocationTimeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="38" viewBox="0 0 40 38" fill="none" {...props}>
      <path
        d="M33.17 8.37c0-3.36-2.74-6.1-6.1-6.1h-1.48v3.73a1.43 1.43 0 01-2.86 0V2.27H10.43v3.73a1.43 1.43 0 01-2.86 0V2.27H6.1C2.74 2.27 0 5.01 0 8.37v.91h33.17V8.37z"
        fill="currentColor"
      />
      <path
        d="M6.1 33.16h12.97a16.4 16.4 0 01-2.67-7.13c-.6-7.3 5.33-13.23 12.62-13.23 1.23 0 2.41.17 3.52.49V12.14H0v14.93c0 3.36 2.74 6.1 6.1 6.1z"
        fill="currentColor"
      />
      <path
        d="M10.43 1.43A1.43 1.43 0 009 0a1.43 1.43 0 00-1.43 1.43v.84h2.86v-.84zM25.59 1.43A1.43 1.43 0 0024.16 0a1.43 1.43 0 00-1.43 1.43v.84h2.86v-.84z"
        fill="currentColor"
      />
      <path
        d="M29.63 15.66c-5.71 0-10.37 4.66-10.37 10.37 0 2.94 2.34 6.53 6.94 10.69a4.29 4.29 0 005.72 0c4.61-4.16 6.94-7.75 6.94-10.69 0-5.71-4.66-10.37-10.37-10.37zm0 15.43a5.06 5.06 0 01-5.04-5.06 5.06 5.06 0 0110.1 0 5.06 5.06 0 01-5.06 5.06z"
        fill="currentColor"
      />
      <path
        d="M29.63 23.84a2.19 2.19 0 100 4.39 2.19 2.19 0 000-4.39z"
        fill="currentColor"
      />
    </svg>
  );
}

export default LocationTimeIcon;

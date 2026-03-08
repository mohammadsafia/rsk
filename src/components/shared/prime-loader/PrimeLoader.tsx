import { Conditional } from '@components/utils';
import { cn } from '@utils';

import { Loader2, LoaderIcon } from 'lucide-react';

type PrimeLoaderProps = {
  displayLogo?: boolean;
  withOverlay?: boolean;
};

function PrimeLoader({ displayLogo = true, withOverlay = true }: PrimeLoaderProps) {
  return (
    <div className={cn('absolute inset-0 z-30 flex flex-col items-center justify-center', withOverlay && 'bg-background')}>
      <Conditional.If condition={displayLogo}>
        <LoaderIcon size={64} className="text-primary animate-pulse" />
      </Conditional.If>

      <Loader2 size={64} className="text-primary mt-10 animate-spin transition-all" />
    </div>
  );
}

export default PrimeLoader;

import { Loader2 } from 'lucide-react';

type PrimeLoaderProps = {
  displayLogo?: boolean;
  withOverlay?: boolean;
  message?: string;
};

function PrimeLoader({ withOverlay = true, message = 'Please Wait ...', ..._ }: PrimeLoaderProps) {
  if (!withOverlay) return <Loader2 size={64} className="text-primary animate-spin" />;

  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex flex-col items-center justify-center">
      <div className="animate-out fade-out direction-alternate repeat-infinite fill-mode-both duration-[3s]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="-466.4 259.6 280.2 47.3" width={300}>
          <polyline
            className="fill-none stroke-primary-400 stroke-[4px] [stroke-linecap:square] [stroke-miterlimit:10] [stroke-dasharray:600] animate-prime-loader-move"
            points="-465.4,281 -436,281 -418.9,281 -423.9,281 -363.2,281 -355.2,269 -345.2,303 -335.2,263 -325.2,291 -319.2,281 -187.2,281"
          />
        </svg>
      </div>

      <p className="text-muted-foreground mt-4 text-sm">{message}</p>
    </div>
  );
}

export default PrimeLoader;

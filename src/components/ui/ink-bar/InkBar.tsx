import { type FC, useRef } from 'react';
import { motion } from 'framer-motion';

import { useInkBar } from '@hooks/motion';

import { cn } from '@utils';

export type InkBarProps = {
  /** Finds the current item inside the bar's (positioned) parent, e.g. '[data-state="on"]'. */
  selector: string;
  className?: string;
};

/** The Ledger ink as one bar that travels between items: it stretches across, then springs into place. Decorative. */
const InkBar: FC<InkBarProps> = ({ selector, className }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const { left, width, opacity } = useInkBar(ref, selector);

  return (
    <motion.span
      ref={ref}
      aria-hidden="true"
      data-slot="ink-bar"
      className={cn('bg-ink pointer-events-none absolute bottom-0 h-(--ink-thickness)', className)}
      style={{ left, width, opacity }}
    />
  );
};

export default InkBar;

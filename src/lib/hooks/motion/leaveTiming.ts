import { MOTION_DURATIONS, MOTION_EASINGS } from '@constants';

/** How long an exit plays: quick, accelerating away (spec: exits are shorter than entrances). */
export const LEAVE_TIMING: KeyframeAnimationOptions = {
  duration: MOTION_DURATIONS.fast,
  easing: MOTION_EASINGS.in,
  fill: 'forwards',
};

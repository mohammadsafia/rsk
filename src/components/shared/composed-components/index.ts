import { withAuth, withConditional } from '@hoc';

// !Direct imports are required and not by mistake to avoid circular dependencies
import Button from '@components/ui/button/Button';
import LoadingButton from '@components/shared/loading-button/LoadingButton';
import TooltipButton from '@components/shared/tooltip-button/TooltipButton';
import Chip from '@components/ui/chip/Chip';

export const ConditionalChip = withConditional(Chip);
export const ComposedButton = withConditional(withAuth(Button));
export const ComposedLoadingButton = withConditional(withAuth(LoadingButton));
export const ComposedTooltipButton = withConditional(withAuth(TooltipButton));

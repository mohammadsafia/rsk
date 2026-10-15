import { withAuth, withConditional } from '@hoc';

// !Direct import is required and not by mistake to avoid circular dependencies
import Button from '@components/ui/button/Button';

export const ComposedButton = withConditional(withAuth(Button));

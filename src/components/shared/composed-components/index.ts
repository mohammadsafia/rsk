import { withAuth, withConditional } from '@hoc';

// !Direct import is required and not by mistake to avoid circular dependencies
import Button from '@components/ui/button/Button';

export const ComposedButton = withConditional(withAuth(Button));

// !Direct import is required and not by mistake to avoid circular dependencies
import DropdownMenu from '@components/ui/dropdown-menu/DropdownMenu';

export const ComposedDropdownItem = withConditional(withAuth(DropdownMenu.Item));

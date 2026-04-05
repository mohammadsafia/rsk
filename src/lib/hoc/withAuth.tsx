/**
 * Higher Order Component to check if the user has the required permissions or roles to access the component.
 * @param WrappedComponent - The component to render if the user has the required permissions or roles.
 * @returns The wrapped component or null if the user does not have the required permissions or roles.
 * @example
 * // Usage
 * const AuthorizedComponent = withAuth(Component);
 * <AuthorizedComponent permissions={["permission1", "permission2"]} roles={["role1", "role2"]} />
 */

import { type ComponentType, type PropsWithChildren } from 'react';
import { useAuthorization } from 'hooks';
import { UserRoles } from 'app-constants';

type WithAuthProps = PropsWithChildren<{
  permissions?: string[];
  roles?: UserRoles[];
}>;

function withAuth<TProps extends object>(WrappedComponent: ComponentType<TProps>) {
  return ({ permissions, roles, ...props }: TProps & WithAuthProps) => {
    const { hasAccess, hasRoles } = useAuthorization(permissions ?? [], roles ?? []);

    if (!permissions && !roles) return <WrappedComponent {...(props as TProps)} />;

    if (roles && roles.length > 0 && !hasRoles) return null;

    if (!hasAccess && !hasRoles) return null;

    return <WrappedComponent {...(props as TProps)} />;
  };
}

export default withAuth;

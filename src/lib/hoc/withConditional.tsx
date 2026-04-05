/**
 * A higher-order component that conditionally renders a component based on a condition.
 * @param WrappedComponent - The component to conditionally render.
 * @returns The wrapped component or null if the condition is false.
 * @example
 * // Usage
 * const ConditionalComponentName = withConditional(Component);
 * <ConditionalComponentName condition={Condition as Boolean} />
 */

import type { ComponentType } from 'react';

function withConditional<TProps extends object>(WrappedComponent: ComponentType<TProps>) {
  return ({ condition, ...props }: TProps & { condition?: boolean }) => {
    if (condition === false) return null;

    return <WrappedComponent {...(props as TProps)} />;
  };
}

export default withConditional;

import { type FC, isValidElement, type ReactElement, type ReactNode } from 'react';

type WhenProps = {
  condition: boolean;
  children: ReactNode;
};

type OtherwiseProps = {
  children: ReactNode;
};

type ConditionalProps = {
  children: Array<ReactElement<WhenProps, FC<WhenProps>> | ReactElement<OtherwiseProps, FC<OtherwiseProps>>>;
};

const When: FC<WhenProps> = ({ condition, children }) => (condition ? <>{children}</> : null);

const Otherwise: FC<OtherwiseProps> = ({ children }) => <>{children}</>;

type ConditionalComponent = FC<ConditionalProps> & {
  If: FC<WhenProps>;
  Else: FC<OtherwiseProps>;
};

const Conditional: ConditionalComponent = ({ children }) => {
  const validComponents = [When, Otherwise];

  children.forEach((child) => {
    const componentName = (child.type as any)?.name ?? (child.type as any)?.render?.name ?? child.type;

    if (!validComponents.includes(child.type as FC<WhenProps> | FC<OtherwiseProps>)) {
      throw new Error(
        `Conditional component only accepts <When /> and <Otherwise /> components as children. Received: <${componentName} />`,
      );
    }
  });

  const matchedChild = children.find((child) => isValidElement(child) && child.type === When && (child.props as WhenProps).condition);

  return matchedChild || children.find((child) => child.type === Otherwise) || null;
};

Conditional.If = When;
Conditional.Else = Otherwise;

export default Conditional;

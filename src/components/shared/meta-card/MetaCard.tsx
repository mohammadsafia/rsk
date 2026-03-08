import { type ComponentProps, type FC, type ReactNode } from 'react';

import { Card, Skeleton } from '@components/ui';
import { Conditional } from '@components/utils';

import { cn } from '@utils';

type MetaCardDirection = 'vertical' | 'horizontal';

type MetaCardProps = ComponentProps<typeof Card> & {
  title?: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  isLoading?: boolean;
  imageURL?: string;
  direction?: MetaCardDirection;
};

type CardComponent = FC<MetaCardProps> & {};

const MetaCardLoader = () => {
  return (
    <div className="flex flex-col space-y-2">
      <Skeleton />

      <Skeleton size="md" />
    </div>
  );
};

const MetaCard: CardComponent = ({ className, title, subtitle, description, imageURL, isLoading, direction = 'vertical', children, ...props }) => {
  if (isLoading) return <MetaCardLoader />;

  const isHorizontal = direction === 'horizontal';

  return (
    <Card shadow="none" className={cn('flex gap-1', isHorizontal ? 'flex-row items-center' : 'flex-col', className)} {...props}>
      <Card.Header className={cn('p-0', isHorizontal && 'flex-1')}>
        <Card.Title className="text-muted-400 text-sm font-normal">{title}</Card.Title>

        <Card.Description>{subtitle}</Card.Description>
      </Card.Header>

      <Card.Content className="p-0 text-sm font-medium">
        <Conditional>
          <Conditional.If condition={!!imageURL}>
            <img className="block object-contain" src={imageURL} alt={title} />
          </Conditional.If>

          <Conditional.If condition={!!description}>{description}</Conditional.If>

          <Conditional.If condition={!!children}>{children}</Conditional.If>

          <Conditional.Else>-</Conditional.Else>
        </Conditional>
      </Card.Content>
    </Card>
  );
};

export default MetaCard;

import { type ComponentProps, type FC, type ReactNode } from 'react';

import { Card, Skeleton } from '@components/ui';
import { Conditional } from '@components/utils';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@utils';

type MetaCardProps = ComponentProps<typeof Card> &
  VariantProps<typeof metaCardVariants> & {
    title?: ReactNode;
    subtitle?: ReactNode;
    description?: ReactNode;
    isLoading?: boolean;
    imageURL?: string;
  };

type CardComponent = FC<MetaCardProps>;

const metaCardVariants = cva('flex gap-1', {
  variants: {
    direction: {
      vertical: 'flex-col',
      horizontal: 'flex-row items-center',
    },
  },
  defaultVariants: {
    direction: 'vertical',
  },
});

const metaCardHeaderVariants = cva('p-0', {
  variants: {
    direction: {
      vertical: '',
      horizontal: 'flex-1',
    },
  },
  defaultVariants: {
    direction: 'vertical',
  },
});

const MetaCardLoader = () => (
  <div className="flex flex-col space-y-2">
    <Skeleton />

    <Skeleton size="md" />
  </div>
);

const MetaCard: CardComponent = ({ className, title, subtitle, description, imageURL, isLoading, direction, children, ...props }) => {
  if (isLoading) return <MetaCardLoader />;

  return (
    <Card shadow="none" className={cn(metaCardVariants({ direction }), className)} {...props}>
      <Card.Header className={cn(metaCardHeaderVariants({ direction }))}>
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

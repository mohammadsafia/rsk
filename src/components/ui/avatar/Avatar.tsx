'use client';

import { type ComponentPropsWithoutRef, type FC, type ReactElement } from 'react';

import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

const avatarVariants = cva('relative flex shrink-0 overflow-hidden rounded-full', {
  variants: {
    size: {
      sm: 'size-6 text-2xs',
      md: 'size-8 text-xs',
      lg: 'size-10 text-sm',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type ImageProps = ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>;

type FallbackProps = ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>;

type AvatarProps = ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> &
  VariantProps<typeof avatarVariants> & {
    children: Array<ReactElement<ImageProps, FC<ImageProps>> | ReactElement<FallbackProps, FC<FallbackProps>>>;
  };

type AvatarComponent = FC<AvatarProps> & {
  Image: FC<ImageProps>;
  Fallback: FC<FallbackProps>;
};

const Image: FC<ImageProps> = ({ className, ...props }) => (
  // Radix mounts the image once it has loaded, so it fades in over the initials' place.
  <AvatarPrimitive.Image
    data-slot="avatar-image"
    className={cn('animate-in fade-in-0 duration-base ease-out motion-reduce:animate-none aspect-square size-full object-cover', className)}
    {...props}
  />
);

const Fallback: FC<FallbackProps> = ({ className, ...props }) => (
  <AvatarPrimitive.Fallback
    data-slot="avatar-fallback"
    className={cn('bg-hover text-fg-muted flex size-full items-center justify-center rounded-full font-medium', className)}
    {...props}
  />
);

const Avatar: AvatarComponent = ({ className, size, ...props }) => (
  <AvatarPrimitive.Root data-slot="avatar" data-size={size ?? 'md'} className={cn(avatarVariants({ size }), className)} {...props} />
);

Avatar.Image = Image;
Avatar.Fallback = Fallback;

export default Avatar;

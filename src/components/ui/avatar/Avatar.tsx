import { type ComponentPropsWithoutRef, type FC, type ReactElement } from 'react';

import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '@utils';

type ImageProps = ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>;

type FallbackProps = ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>;

type AvatarProps = ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
  children: Array<ReactElement<ImageProps, FC<ImageProps>> | ReactElement<FallbackProps, FC<FallbackProps>>>;
};

type AvatarComponent = FC<AvatarProps> & {
  Image: FC<ImageProps>;
  Fallback: FC<FallbackProps>;
};

const Image: FC<ImageProps> = ({ className, ...props }) => (
  <AvatarPrimitive.Image data-slot="avatar-iamge" className={cn('aspect-square h-full w-full', className)} {...props} />
);

const Fallback: FC<FallbackProps> = ({ className, ...props }) => (
  <AvatarPrimitive.Fallback
    data-slot="avatar-fallback"
    className={cn('bg-background flex h-full w-full items-center justify-center rounded-full', className)}
    {...props}
  />
);

const Avatar: AvatarComponent = ({ className, ...props }) => (
  <AvatarPrimitive.Root
    data-slot="avatar"
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
);

Avatar.Image = Image;
Avatar.Fallback = Fallback;

export default Avatar;

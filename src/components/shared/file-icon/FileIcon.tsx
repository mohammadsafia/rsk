import { type ComponentProps, type FC } from 'react';

import { Conditional } from '@components/utils';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@utils';

import { File, FileAudio, FileImage, FileSpreadsheet, FileText, FileVideo, Folder, type LucideIcon } from 'lucide-react';

export type FileExtension =
  | 'pdf'
  | 'doc'
  | 'docx'
  | 'txt'
  | 'csv'
  | 'xls'
  | 'xlsx'
  | 'ppt'
  | 'pptx'
  | 'jpg'
  | 'jpeg'
  | 'png'
  | 'gif'
  | 'mp3'
  | 'wav'
  | 'ogg'
  | 'webm'
  | 'mp4'
  | 'avi'
  | 'mov'
  | 'mkv'
  | 'folder';

export type NormalizedExtension = FileExtension | 'unknown';

type FileIconProps = Omit<ComponentProps<'span'>, 'children'> &
  VariantProps<typeof fileIconVariants> & {
    extension: string | null | undefined;
    size?: number;
  };

const EXTENSION_ICON_MAP: Record<NormalizedExtension, LucideIcon> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  txt: FileText,
  csv: FileSpreadsheet,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  ppt: File,
  pptx: File,
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  gif: FileImage,
  mp3: FileAudio,
  wav: FileAudio,
  ogg: FileAudio,
  webm: FileAudio,
  mp4: FileVideo,
  avi: FileVideo,
  mov: FileVideo,
  mkv: FileVideo,
  folder: Folder,
  unknown: File,
};

const fileIconVariants = cva('inline-flex shrink-0 items-center justify-center', {
  variants: {
    variant: {
      plain: 'text-muted-400',
      chip: 'bg-primary-15 text-primary gap-1 rounded-md p-1.5',
    },
  },
  defaultVariants: {
    variant: 'plain',
  },
});

const normalize = (extension: string | null | undefined): NormalizedExtension => {
  const key = extension?.toLowerCase().replace(/^\./, '') ?? '';

  return key in EXTENSION_ICON_MAP ? (key as NormalizedExtension) : 'unknown';
};

const FileIcon: FC<FileIconProps> = ({ className, extension, size = 20, variant, ...props }) => {
  const key = normalize(extension);
  const Icon = EXTENSION_ICON_MAP[key];
  const showLabel = variant === 'chip' && key !== 'unknown' && key !== 'folder';

  return (
    <span data-slot="file-icon" className={cn(fileIconVariants({ variant }), className)} {...props}>
      <Icon size={size} />

      <Conditional.If condition={showLabel}>
        <span className="text-2xs font-bold uppercase">{key}</span>
      </Conditional.If>
    </span>
  );
};

FileIcon.displayName = 'FileIcon';

export default FileIcon;

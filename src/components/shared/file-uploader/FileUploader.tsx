import {
  type ChangeEvent,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  createContext,
  type FC,
  forwardRef,
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Button, Chip, ScrollArea } from '@components/ui';
import { TooltipButton } from '@components/shared';
import { Conditional } from '@components/utils';

import { cn } from '@utils';

import { DownloadIcon, Loader2Icon, PaperclipIcon, XCircleIcon, XIcon } from 'lucide-react';

type FileUploaderDropzoneGroupProps = ComponentPropsWithoutRef<'div'>;

type FileUploaderDropzoneProps = Omit<ComponentProps<'input'>, 'placeholder'> & {
  placeholder?: ReactNode;
};

type FileUploaderActionsProps = ComponentPropsWithoutRef<'div'> & {
  onDownload?: () => void;
  clearable?: boolean;
};

type FileUploaderFileListProps = {
  className?: string;
  variant?: 'list' | 'chips';
};

type FileUploaderImagePreviewProps = ComponentPropsWithoutRef<'div'>;

export type FileUploaderProps = PropsWithChildren<{
  name: string;
  className?: string;
  value?: File | File[] | null;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  isUploading?: boolean;
  onChange: (value: File | File[] | null) => void;
}>;

type FileUploaderContextValue = {
  name: string;
  inputId: string;
  files: File[];
  accept: string;
  multiple: boolean;
  disabled: boolean;
  isUploading: boolean;
  onChange: (files: File[]) => void;
  onRemove: (index: number) => void;
};

type FileUploaderComponent = FC<FileUploaderProps> & {
  DropzoneGroup: FC<FileUploaderDropzoneGroupProps>;
  Dropzone: FC<FileUploaderDropzoneProps>;
  Actions: FC<FileUploaderActionsProps>;
  FileList: FC<FileUploaderFileListProps>;
  ImagePreview: FC<FileUploaderImagePreviewProps>;
};

const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  return `${(bytes / 1024).toFixed(2)} KB`;
};

const isImageFile = (file: File): boolean => file.type.startsWith('image/');

const getUniqueFiles = (existing: File[], incoming: File[]): File[] =>
  incoming.filter((f) => !existing.some((e) => e.name === f.name && e.size === f.size));

const FileUploaderContext = createContext<FileUploaderContextValue | null>(null);

const useFileUploaderContext = () => {
  const context = useContext(FileUploaderContext);

  if (!context) throw new Error('FileUploader subcomponents must be used within <FileUploader>');

  return context;
};

const FileUploaderDropzoneGroup: FC<FileUploaderDropzoneGroupProps> = ({ className, children, ...props }) => {
  const { disabled, isUploading } = useFileUploaderContext();

  return (
    <div
      data-slot="file-uploader-dropzone-group"
      className={cn(
        'border-muted-200 bg-background text-muted-400 relative flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm transition-[color,box-shadow] outline-none',
        !disabled && 'hover:border-primary',
        disabled && 'bg-muted-50 text-muted-300',
        isUploading && 'pointer-events-none',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const FileUploaderDropzone: FC<FileUploaderDropzoneProps> = ({ ref, placeholder, className, ...props }) => {
  const { files, onChange, accept, multiple, disabled, isUploading, name, inputId } = useFileUploaderContext();

  const singleFile = !multiple && files.length > 0 ? files[0] : null;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files ?? []);

    if (!incoming.length) return;

    onChange(multiple ? [...files, ...getUniqueFiles(files, incoming)] : [incoming[0]]);

    event.target.value = '';
  };

  return (
    <>
      <input
        ref={ref}
        accept={accept}
        type="file"
        id={inputId}
        name={name}
        className="hidden"
        disabled={disabled || isUploading}
        onChange={handleChange}
        multiple={multiple}
        {...props}
      />

      <label
        htmlFor={inputId}
        data-slot="file-uploader-dropzone"
        className={cn(
          'flex min-w-0 grow cursor-pointer items-center justify-center gap-2 after:absolute after:inset-0',
          disabled && 'pointer-events-none',
          className,
        )}
      >
        <Conditional>
          <Conditional.If condition={isUploading}>
            <Loader2Icon size={20} className="animate-spin" />
          </Conditional.If>

          <Conditional.If condition={!!singleFile}>
            <PaperclipIcon size={16} className="shrink-0" />

            <span className="text-foreground truncate">{singleFile?.name}</span>

            <span className="shrink-0 text-xs">{formatFileSize(singleFile?.size ?? 0)}</span>
          </Conditional.If>

          <Conditional.Else>
            <PaperclipIcon size={20} />

            <span>{placeholder}</span>
          </Conditional.Else>
        </Conditional>
      </label>
    </>
  );
};

const FileUploaderActions: FC<FileUploaderActionsProps> = ({ onDownload, clearable = true, className, ...props }) => {
  const { files, onRemove, multiple, disabled, isUploading } = useFileUploaderContext();

  const showClear = clearable && !multiple && files.length > 0 && !disabled && !isUploading;
  const showDownload = !!onDownload && !isUploading;

  if (!showClear && !showDownload) return null;

  return (
    <div data-slot="file-uploader-actions" className={cn('relative z-10 flex shrink-0 items-center gap-2', className)} {...props}>
      <Conditional.If condition={showDownload}>
        <TooltipButton asChild title="Download" variant="ghost" size="unstyled" type="button" onClick={onDownload}>
          <DownloadIcon size={16} className="text-primary" />
        </TooltipButton>
      </Conditional.If>

      <Conditional.If condition={showClear}>
        <TooltipButton asChild title="Clear" variant="ghost-muted-destructive" size="unstyled" type="button" onClick={() => onRemove(0)}>
          <XCircleIcon size={16} />
        </TooltipButton>
      </Conditional.If>
    </div>
  );
};

const FileUploaderFileList: FC<FileUploaderFileListProps> = ({ variant = 'list', className }) => {
  const { files, onRemove, disabled, isUploading } = useFileUploaderContext();

  if (files.length === 0) return null;

  if (variant === 'chips') {
    return (
      <ScrollArea>
        <div data-slot="file-uploader-file-list" className={cn('flex max-h-16 flex-wrap items-center gap-1', className)}>
          {files.map((file, index) => (
            <Chip key={`${file.name}-${index}`} variant="muted" size="xs" className="justify-between gap-1">
              <span className="max-w-36 truncate">{file.name}</span>

              <Conditional.If condition={!disabled && !isUploading}>
                <Button className="shrink-0" variant="ghost-destructive" size="unstyled" type="button" onClick={() => onRemove(index)}>
                  <XCircleIcon size={14} />
                </Button>
              </Conditional.If>
            </Chip>
          ))}
        </div>

        <ScrollArea.Bar />
      </ScrollArea>
    );
  }

  return (
    <ScrollArea>
      <ul data-slot="file-uploader-file-list" className={cn('grid max-h-16 grid-cols-[minmax(0,1fr)] gap-1', className)}>
        {files.map((file, index) => (
          <li key={`${file.name}-${index}`} className="border-muted-200 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <PaperclipIcon size={14} className="text-primary shrink-0" />

            <span className="flex-1 truncate" title={file.name}>
              {file.name}
            </span>

            <span className="text-muted-400 shrink-0 text-xs">{formatFileSize(file.size)}</span>

            <Conditional.If condition={!disabled && !isUploading}>
              <Button variant="ghost-muted-destructive" size="unstyled" type="button" onClick={() => onRemove(index)}>
                <XCircleIcon size={16} />
              </Button>
            </Conditional.If>
          </li>
        ))}
      </ul>

      <ScrollArea.Bar />
    </ScrollArea>
  );
};

const FileUploaderImagePreview: FC<FileUploaderImagePreviewProps> = ({ className, ...props }) => {
  const { files, onRemove, multiple, disabled, isUploading } = useFileUploaderContext();

  const [urls, setUrls] = useState<string[]>([]);

  const imageEntries = useMemo(
    () =>
      files.reduce<Array<{ file: File; index: number }>>((acc, file, index) => (isImageFile(file) ? [...acc, { file, index }] : acc), []),
    [files],
  );

  const isCompact = imageEntries.length <= 2;

  useEffect(() => {
    const created = imageEntries.map(({ file }) => URL.createObjectURL(file));

    setUrls(created);

    return () => created.forEach(URL.revokeObjectURL);
  }, [imageEntries]);

  if (imageEntries.length === 0) return null;

  return (
    <ScrollArea>
      <div
        data-slot="file-uploader-image-preview"
        className={cn('gap-2', isCompact ? 'grid grid-cols-2' : 'flex max-h-18 flex-wrap', className)}
        {...props}
      >
        {imageEntries.map(({ file, index }, i) => {
          const url = urls[i];

          if (!url) return null;

          return (
            <div key={`${file.name}-${file.size}`} className="group/file-uploader-image-preview relative overflow-hidden rounded-lg">
              <img
                src={url}
                alt={file.name}
                className={cn('border-muted-200 shrink-0 rounded-lg border object-fill', isCompact ? 'h-28 w-full' : 'size-16')}
              />

              <Conditional.If condition={multiple && !disabled && !isUploading}>
                <Button
                  className="absolute inset-e-1 inset-bs-1 hidden items-center justify-center rounded-full group-hover/file-uploader-image-preview:flex"
                  variant="outline-destructive"
                  size="unstyled"
                  type="button"
                  onClick={() => onRemove(index)}
                >
                  <XIcon size={16} />
                </Button>
              </Conditional.If>
            </div>
          );
        })}
      </div>

      <ScrollArea.Bar />
    </ScrollArea>
  );
};

const FileUploader: FileUploaderComponent = ({
  value,
  onChange,
  accept = 'image/*',
  multiple = false,
  disabled = false,
  isUploading = false,
  name,
  children,
  className,
}) => {
  const inputId = `${name}-file-upload`;

  const files = useMemo(() => {
    if (!value) return [];

    if (Array.isArray(value)) return value;

    return [value];
  }, [value]);

  const handleChange = useCallback(
    (nextFiles: File[]) => onChange(nextFiles.length === 0 ? null : multiple ? nextFiles : nextFiles[0]),
    [multiple, onChange],
  );

  const handleRemove = useCallback(
    (index: number) => {
      handleChange(files.filter((_, i) => i !== index));
    },
    [files, handleChange],
  );

  const contextValue = useMemo<FileUploaderContextValue>(
    () => ({ files, onChange: handleChange, onRemove: handleRemove, accept, multiple, disabled, isUploading, name, inputId }),
    [files, handleChange, handleRemove, accept, multiple, disabled, isUploading, name, inputId],
  );

  return (
    <FileUploaderContext.Provider value={contextValue}>
      <div data-slot="file-uploader" className={cn('flex w-full flex-col gap-2', className)}>
        {children}
      </div>
    </FileUploaderContext.Provider>
  );
};

FileUploader.DropzoneGroup = FileUploaderDropzoneGroup;
// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
FileUploader.Dropzone = forwardRef<HTMLInputElement, FileUploaderDropzoneProps>((props, ref) => FileUploaderDropzone({ ...props, ref }));
FileUploader.Actions = FileUploaderActions;
FileUploader.FileList = FileUploaderFileList;
FileUploader.ImagePreview = FileUploaderImagePreview;

FileUploaderDropzoneGroup.displayName = 'FileUploaderDropzoneGroup';
FileUploader.Dropzone.displayName = 'FileUploaderDropzone';
FileUploaderActions.displayName = 'FileUploaderActions';
FileUploaderFileList.displayName = 'FileUploaderFileList';
FileUploaderImagePreview.displayName = 'FileUploaderImagePreview';
FileUploader.displayName = 'FileUploader';

export default FileUploader;

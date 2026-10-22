'use client';

import {
  type ChangeEvent,
  type ComponentProps,
  type DragEvent,
  type ComponentPropsWithoutRef,
  createContext,
  type FC,
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Button, Tag, ScrollArea, IconButton, Spinner } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { DownloadIcon, PaperclipIcon, XCircleIcon, XIcon } from 'lucide-react';

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

/** Whether `file` matches an input `accept` list: MIME types, wildcards (`image/*`) or extensions (`.pdf`). */
const acceptsFile = (file: File, accept: string) => {
  const rules = accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  if (!rules.length) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some((rule) =>
    rule.startsWith('.') ? name.endsWith(rule) : rule.endsWith('/*') ? type.startsWith(rule.slice(0, -1)) : type === rule,
  );
};

const useFileUploaderContext = () => {
  const context = useContext(FileUploaderContext);

  if (!context) throw new Error('FileUploader subcomponents must be used within <FileUploader>');

  return context;
};

const FileUploaderDropzoneGroup: FC<FileUploaderDropzoneGroupProps> = ({ className, children, ...props }) => {
  const { files, onChange, accept, multiple, disabled, isUploading } = useFileUploaderContext();
  // Entering a child fires dragenter before the parent's dragleave, so count to know when the file has really left.
  const [dragDepth, setDragDepth] = useState(0);

  // Always cancel the drop's default: otherwise the browser opens the dropped file in the tab and the form is lost.
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragDepth(0);
    if (disabled || isUploading) return;
    const incoming = Array.from(event.dataTransfer?.files ?? []).filter((file) => acceptsFile(file, accept));
    if (!incoming.length) return;
    onChange(multiple ? [...files, ...getUniqueFiles(files, incoming)] : [incoming[0]]);
  };

  return (
    <div
      data-slot="file-uploader-dropzone-group"
      data-drag-over={(dragDepth > 0 && !disabled) || undefined}
      onDragEnter={() => setDragDepth((depth) => depth + 1)}
      onDragLeave={() => setDragDepth((depth) => Math.max(0, depth - 1))}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      className={cn(
        'border-border bg-surface text-fg-muted duration-fast relative flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm transition-colors outline-none',
        // A file held over the zone: the dashed border turns into a solid ink line.
        'data-[drag-over]:border-ink data-[drag-over]:border-solid',
        'has-[input:focus-visible]:ring-ring has-[input:focus-visible]:ring-2',
        !disabled && 'hover:border-border-strong',
        disabled && 'bg-surface-sunken text-fg-subtle cursor-not-allowed',
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
        className="peer sr-only"
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
            <Spinner size="sm" />
          </Conditional.If>

          <Conditional.If condition={!!singleFile}>
            <PaperclipIcon size={16} className="shrink-0" />

            <span className="text-fg truncate">{singleFile?.name}</span>

            <span dir="ltr" className="shrink-0 text-xs tabular-nums">
              {formatFileSize(singleFile?.size ?? 0)}
            </span>
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

  const { t } = useAppTranslation('common');

  const showClear = clearable && !multiple && files.length > 0 && !disabled && !isUploading;
  const showDownload = !!onDownload && !isUploading;

  if (!showClear && !showDownload) return null;

  return (
    <div data-slot="file-uploader-actions" className={cn('relative z-10 flex shrink-0 items-center gap-2', className)} {...props}>
      <Conditional.If condition={showDownload}>
        <IconButton size="sm" tooltip={false} aria-label={t('download')} className="text-accent" onClick={onDownload}>
          <DownloadIcon aria-hidden="true" />
        </IconButton>
      </Conditional.If>

      <Conditional.If condition={showClear}>
        <IconButton size="sm" tooltip={false} aria-label={t('clear')} className="hover:text-danger" onClick={() => onRemove(0)}>
          <XCircleIcon aria-hidden="true" />
        </IconButton>
      </Conditional.If>
    </div>
  );
};

/** A key per File object, so removing one file leaves the other rows mounted (an index key would remount them all). */
const fileKeys = new WeakMap<File, string>();
let nextFileKey = 0;
const fileKey = (file: File) => {
  let key = fileKeys.get(file);
  if (key === undefined) {
    nextFileKey += 1;
    key = `file-${nextFileKey}`;
    fileKeys.set(file, key);
  }
  return key;
};

const FileUploaderFileList: FC<FileUploaderFileListProps> = ({ variant = 'list', className }) => {
  const { t } = useAppTranslation('common');

  const { files, onRemove, disabled, isUploading } = useFileUploaderContext();

  if (files.length === 0) return null;

  if (variant === 'chips') {
    return (
      <ScrollArea>
        <div data-slot="file-uploader-file-list" className={cn('flex max-h-16 flex-wrap items-center gap-1', className)}>
          {files.map((file, index) => (
            <Conditional key={fileKey(file)}>
              <Conditional.If condition={!disabled && !isUploading}>
                <Tag size="sm" label={file.name} onRemove={() => onRemove(index)}>
                  <span className="max-w-36 truncate">{file.name}</span>
                </Tag>
              </Conditional.If>

              <Conditional.Else>
                <Tag size="sm">
                  <span className="max-w-36 truncate">{file.name}</span>
                </Tag>
              </Conditional.Else>
            </Conditional>
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
          <li
            key={fileKey(file)}
            // A newly added file rises into the list.
            className="border-border animate-in fade-in-0 slide-in-from-bottom-1 duration-spring ease-spring flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
          >
            <PaperclipIcon size={14} aria-hidden="true" className="text-fg-muted shrink-0" />

            <span className="flex-1 truncate" title={file.name}>
              {file.name}
            </span>

            <span dir="ltr" className="text-fg-muted shrink-0 text-xs tabular-nums">
              {formatFileSize(file.size)}
            </span>

            <Conditional.If condition={!disabled && !isUploading}>
              <IconButton tone="danger" size="sm" tooltip={false} type="button" aria-label={t('clear')} onClick={() => onRemove(index)}>
                <XCircleIcon size={16} />
              </IconButton>
            </Conditional.If>
          </li>
        ))}
      </ul>

      <ScrollArea.Bar />
    </ScrollArea>
  );
};

const FileUploaderImagePreview: FC<FileUploaderImagePreviewProps> = ({ className, ...props }) => {
  const { t } = useAppTranslation('common');

  const { files, onRemove, multiple, disabled, isUploading } = useFileUploaderContext();

  const imageEntries = useMemo(
    () =>
      files.reduce<Array<{ file: File; index: number }>>((acc, file, index) => (isImageFile(file) ? [...acc, { file, index }] : acc), []),
    [files],
  );

  const isCompact = imageEntries.length <= 2;

  // One object URL per previewed image, made with the list and revoked when it changes or unmounts.
  const urls = useMemo(() => imageEntries.map(({ file }) => URL.createObjectURL(file)), [imageEntries]);
  const liveUrls = useRef<string[] | null>(null);
  useEffect(() => {
    liveUrls.current = urls;
    return () => {
      liveUrls.current = null;
      // Revoke a task later: StrictMode's dev remount runs this cleanup and re-mounts at once with the same list.
      setTimeout(() => {
        if (liveUrls.current !== urls) urls.forEach((url) => URL.revokeObjectURL(url));
      });
    };
  }, [urls]);

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
            <div key={fileKey(file)} className="group/file-uploader-image-preview relative overflow-hidden rounded-lg">
              <img
                src={url}
                alt={file.name}
                className={cn('border-border shrink-0 rounded-lg border object-fill', isCompact ? 'h-28 w-full' : 'size-16')}
              />

              <Conditional.If condition={multiple && !disabled && !isUploading}>
                <IconButton
                  className="bg-surface absolute inset-e-1 inset-bs-1 hidden rounded-full group-hover/file-uploader-image-preview:flex"
                  variant="outline"
                  tone="danger"
                  size="sm"
                  tooltip={false}
                  type="button"
                  aria-label={t('clear')}
                  onClick={() => onRemove(index)}
                >
                  <XIcon size={16} />
                </IconButton>
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
FileUploader.Dropzone = FileUploaderDropzone;
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

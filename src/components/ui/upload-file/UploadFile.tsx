import type { ChangeEvent, ReactNode } from 'react';
import type { ControllerRenderProps, FieldError, FieldValues } from 'react-hook-form';

import { Button } from '@components/ui';
import { Conditional } from '@components/utils';

import { cn } from '@utils';

import { LoaderIcon, PaperclipIcon, XCircleIcon } from 'lucide-react';
import { FormMessage } from '@components/forms';

export type UploadFileProps = ControllerRenderProps<FieldValues, string> & {
  accept?: string;
  isUploading?: boolean;
  error?: FieldError;
  label?: ReactNode;
};

function UploadFile({ ref, name, value, label, disabled, accept = 'image/*', isUploading = false, error, onChange }: UploadFileProps) {
  const onRemoveFile = () => {
    onChange('');
  };

  const onUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    onChange(file);
  };

  return (
    <div data-slot="upload-file" className="relative w-full">
      <input
        ref={ref}
        accept={accept}
        type="file"
        id={`${name}-file-upload`}
        className="hidden"
        disabled={disabled || isUploading}
        onChange={onUploadChange}
      />

      <label
        htmlFor={`${name}-file-upload`}
        className={cn(
          'border-primary relative flex cursor-pointer items-center justify-center gap-4 overflow-visible rounded-lg border border-dashed p-5',
          error && 'border-destructive text-destructive',
          disabled && 'cursor-default opacity-50',
        )}
      >
        <Conditional>
          <Conditional.If condition={isUploading}>
            <LoaderIcon size={24} className="animate-spin" />
          </Conditional.If>

          <Conditional.If condition={!!value}>
            <p title={value?.name} className="max-w-[60%] overflow-hidden text-ellipsis">
              {value?.name ?? label}
            </p>

            <p className="text-sm">{(+(value?.size ?? 0) / 1024).toFixed(2)} KB</p>
          </Conditional.If>

          <Conditional.Else>
            <PaperclipIcon size={24} />

            <p>{label}</p>
          </Conditional.Else>
        </Conditional>

        <FormMessage hidden={!error} error={error!} />
      </label>

      <Conditional.If condition={!!value && !disabled && !isUploading}>
        <div className="absolute end-[1%] top-1/2 z-10 -translate-y-1/2">
          <Button variant="outline" size="icon" type="button" onClick={onRemoveFile}>
            <XCircleIcon size={20} />
          </Button>
        </div>
      </Conditional.If>
    </div>
  );
}

export default UploadFile;

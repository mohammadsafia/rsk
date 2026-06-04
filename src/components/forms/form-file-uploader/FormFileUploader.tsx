import { type ReactNode } from 'react';

import { Controller, type FieldValues } from 'react-hook-form';

import { FileUploader, type FileUploaderProps } from '@components/shared';
import { Conditional } from '@components/utils';
import { FormControl, FormLabel, FormMessage } from '@components/forms';

import { cn } from '@utils';

import type { ControlledFieldBaseProps } from '@app-types';

type FormFileUploaderOwnProps = Pick<FileUploaderProps, 'accept' | 'multiple' | 'isUploading' | 'disabled' | 'className'> & {
  placeholder?: ReactNode;
  onDownload?: () => void;
  clearable?: boolean;
  listVariant?: 'list' | 'chips';
  showPreview?: boolean;
};

type FormFileUploaderProps<TFieldValues extends FieldValues> = ControlledFieldBaseProps<TFieldValues, FormFileUploaderOwnProps>;

function FormFileUploader<TFieldValues extends FieldValues>({
  name,
  rules,
  control,
  label,
  tooltip,
  containerClassName,
  labelClassName,
  className,
  errorClassName,
  required,
  disabled,
  accept,
  multiple = false,
  isUploading,
  placeholder,
  onDownload,
  clearable,
  listVariant = 'list',
  showPreview = false,
}: FormFileUploaderProps<TFieldValues>) {
  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field: { ref, value, onChange, onBlur, ...field }, fieldState: { error } }) => (
        <FormControl className={containerClassName}>
          <FormLabel
            className={labelClassName}
            htmlFor={`${name}-file-upload`}
            tooltip={tooltip}
            required={required}
            hidden={!label}
            error={error!}
          >
            {label}
          </FormLabel>

          <FileUploader
            name={name}
            value={value}
            onChange={onChange}
            accept={accept}
            multiple={multiple}
            disabled={field.disabled || disabled}
            isUploading={isUploading}
            className={cn(
              error &&
                '**:data-[slot=file-uploader-dropzone-group]:border-destructive **:data-[slot=file-uploader-dropzone-group]:text-destructive **:data-[slot=file-uploader-dropzone-group]:hover:border-destructive',
              className,
            )}
          >
            <FileUploader.DropzoneGroup>
              <FileUploader.Dropzone ref={ref} onBlur={onBlur} placeholder={placeholder ?? label} />

              <FileUploader.Actions onDownload={onDownload} clearable={clearable} />

              <FormMessage className={errorClassName} hidden={!error} error={error!} />
            </FileUploader.DropzoneGroup>

            <Conditional.If condition={multiple && !showPreview}>
              <FileUploader.FileList variant={listVariant} />
            </Conditional.If>

            <Conditional.If condition={showPreview}>
              <FileUploader.ImagePreview />
            </Conditional.If>
          </FileUploader>
        </FormControl>
      )}
    />
  );
}

FormFileUploader.displayName = 'FormFileUploader';

export default FormFileUploader;

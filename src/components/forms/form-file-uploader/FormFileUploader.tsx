'use client';

import { type ReactNode } from 'react';

import { Controller, type FieldValues } from 'react-hook-form';

import { FileUploader, type FileUploaderProps } from '@components/shared';
import { Conditional } from '@components/utils';
import { FormField } from '@components/forms';

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
  description,
  tooltip,
  className,
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
        <FormField id={`${name}-file-upload`} label={label} description={description} tooltip={tooltip} required={required} error={error}>
          {({ id: _inputId, invalid, ...fieldControl }) => (
            <FileUploader
              name={name}
              value={value}
              onChange={onChange}
              accept={accept}
              multiple={multiple}
              disabled={field.disabled || disabled}
              isUploading={isUploading}
              className={cn(invalid && '**:data-[slot=file-uploader-dropzone-group]:border-danger', className)}
            >
              <FileUploader.DropzoneGroup>
                <FileUploader.Dropzone
                  ref={ref}
                  onBlur={onBlur}
                  aria-invalid={invalid || undefined}
                  placeholder={placeholder ?? label}
                  {...fieldControl}
                />

                <FileUploader.Actions onDownload={onDownload} clearable={clearable} />
              </FileUploader.DropzoneGroup>

              <Conditional.If condition={multiple && !showPreview}>
                <FileUploader.FileList variant={listVariant} />
              </Conditional.If>

              <Conditional.If condition={showPreview}>
                <FileUploader.ImagePreview />
              </Conditional.If>
            </FileUploader>
          )}
        </FormField>
      )}
    />
  );
}

FormFileUploader.displayName = 'FormFileUploader';

export default FormFileUploader;

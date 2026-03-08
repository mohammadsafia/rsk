import { type ReactNode, useState } from 'react';
import { type Control, Controller, type FieldError, type FieldValues, type Path } from 'react-hook-form';

import { Conditional } from '@components/utils';
import { UploadFile, UploadFilePreview, type UploadFilePreviewProps } from '@components/ui';

type FormUploadFileBase<T extends FieldValues = FieldValues> = {
  name: Path<T>;
  parseError?: (error: FieldError) => string;
  control?: Control<T>;
  accept?: string;
  isUploading?: boolean;
  label?: ReactNode;
};

type FormUploadFileProps<TFieldValues extends FieldValues = FieldValues> = FormUploadFileBase<TFieldValues> &
  Omit<UploadFilePreviewProps, 'label'> & {
    label?: ReactNode;
    disabled?: boolean;
  };

function FormUploadFile<TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  disabled,
  isUploading,
  canUpload = true,
  canReplace = true,
  onDownload,
  label,
  accept,
}: FormUploadFileProps<TFieldValues>) {
  const [canUploadFile, setCanUploadFile] = useState(canUpload);

  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        return (
          <Conditional>
            <Conditional.If condition={canUploadFile}>
              <UploadFile {...field} error={error} accept={accept} isUploading={isUploading} label={label} disabled={disabled} />
            </Conditional.If>

            <Conditional.Else>
              <UploadFilePreview
                label={label}
                value={field.value}
                isUploading={isUploading}
                canUpload={canUploadFile}
                canReplace={canReplace}
                onCanUploadChange={() => setCanUploadFile(!canUploadFile)}
                onDownload={onDownload}
              />
            </Conditional.Else>
          </Conditional>
        );
      }}
    />
  );
}

export default FormUploadFile;

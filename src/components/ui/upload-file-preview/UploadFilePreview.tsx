import type { ReactNode } from 'react';
import { Button } from '@components/ui';
import { Conditional } from '@components/utils';

import { DownloadIcon, PaperclipIcon } from 'lucide-react';
import { cn } from '@utils';

export type UploadFilePreviewProps = {
  label: ReactNode;
  value?: File;
  disabled?: boolean;
  canUpload?: boolean;
  canReplace?: boolean;
  isUploading?: boolean;
  onCanUploadChange?(): void;
  onDownload?(): void;
};

function UploadFilePreview(props: UploadFilePreviewProps) {
  const previewURL = props.value ? URL.createObjectURL(props.value) : '';

  return (
    <div data-slot="upload-file-preview" className="relative flex w-full items-center overflow-hidden">
      <div className="relative w-full">
        <div
          className={cn(
            'border-primary bg-background flex min-h-[40px] w-full flex-col rounded-md border border-dashed p-2',
            props.disabled && 'border-muted opacity-50',
          )}
        >
          <label className="absolute start-1/2 top-1/2 -translate-1/2">{props.label}</label>

          <div className="flex w-full items-center justify-between pt-1">
            <div className="flex-1 truncate" />

            <div className="flex flex-row">
              <Conditional.If condition={!!props.canReplace && !props.disabled}>
                <Button title={`Upload ${props.label}`} variant="outline" size="icon" type="button" onClick={props.onCanUploadChange}>
                  <PaperclipIcon className="text-primary" size={20} />
                </Button>
              </Conditional.If>

              <Conditional.If condition={!!props.onDownload}>
                <Button title={`Download ${props.label}`} variant="outline" size="icon" type="button" onClick={props.onDownload}>
                  <DownloadIcon className="text-primary" size={20} />
                </Button>
              </Conditional.If>
            </div>
          </div>
        </div>
      </div>

      <Conditional.If condition={!props.isUploading && !!previewURL}>
        <img src={previewURL} alt="Upload Preview" className="absolute start-[5%] top-[30%] h-1/2 object-contain" />
      </Conditional.If>

      <div className={cn('absolute start-[25%] top-[40%] flex max-w-[55%] items-center gap-1', !props.isUploading && 'hidden')}>
        <Conditional.If condition={!!props.value?.name}>
          <p title={props.value?.name} className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {props.value?.name}
          </p>
        </Conditional.If>

        <Conditional.If condition={!!props.value?.size}>
          <p className="text-sm">{(+(props.value?.size ?? 0) / 1024).toFixed(2)} KB</p>
        </Conditional.If>
      </div>
    </div>
  );
}

export default UploadFilePreview;

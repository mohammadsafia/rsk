// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { FileUploader } from '@components/shared';

import '../../../i18n';

afterEach(cleanup);

describe('FileUploader.FileList chips', () => {
  it('uses the Tag remove control, named after the file', async () => {
    const handleChange = vi.fn();
    const file = new File(['x'], 'report.pdf', { type: 'application/pdf' });
    render(
      <FileUploader name="attachments" value={[file]} multiple onChange={handleChange}>
        <FileUploader.FileList variant="chips" />
      </FileUploader>,
    );
    const remove = screen.getByRole('button', { name: 'Remove report.pdf' });
    expect(remove.getAttribute('data-slot')).toBe('tag-remove');
    fireEvent.click(remove);
    await vi.waitFor(() => expect(handleChange).toHaveBeenCalledWith(null));
  });
});
describe('FileUploader keyboard access', () => {
  it('keeps the file input focusable and the actions as buttons', () => {
    const file = new File(['x'], 'scan.png', { type: 'image/png' });
    render(
      <FileUploader name="scan" value={[file]} onChange={vi.fn()}>
        <FileUploader.DropzoneGroup>
          <FileUploader.Dropzone placeholder="Upload scan" />
          <FileUploader.Actions onDownload={vi.fn()} />
        </FileUploader.DropzoneGroup>
      </FileUploader>,
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.className).toContain('sr-only');
    expect(input.className).not.toMatch(/(^|\s)hidden(\s|$)/);
    expect(screen.getByRole('button', { name: 'Download' }).tagName).toBe('BUTTON');
    expect(screen.getByRole('button', { name: 'Clear' }).tagName).toBe('BUTTON');
  });

  it('shows the ink border while a file is held over the drop zone, and new file rows rise in', () => {
    const file = new File(['x'], 'scan.pdf', { type: 'application/pdf' });
    render(
      <FileUploader name="scan" value={[file]} onChange={vi.fn()}>
        <FileUploader.DropzoneGroup>
          <FileUploader.Dropzone placeholder="Upload scan" />
        </FileUploader.DropzoneGroup>
        <FileUploader.FileList />
      </FileUploader>,
    );
    const group = document.querySelector<HTMLElement>('[data-slot="file-uploader-dropzone-group"]')!;
    expect(group.className).toContain('data-[drag-over]:border-ink');
    fireEvent.dragEnter(group);
    expect(group.hasAttribute('data-drag-over')).toBe(true);
    fireEvent.dragLeave(group);
    expect(group.hasAttribute('data-drag-over')).toBe(false);
    fireEvent.dragEnter(group);
    fireEvent.drop(group);
    expect(group.hasAttribute('data-drag-over')).toBe(false);
    const row = document.querySelector<HTMLElement>('[data-slot="file-uploader-file-list"] li')!;
    for (const name of ['animate-in', 'slide-in-from-bottom-1', 'duration-spring', 'ease-spring']) expect(row.className).toContain(name);
  });

  it('a drop on the zone adds the files (never navigates away); files the zone does not accept are ignored', () => {
    const handleChange = vi.fn();
    render(
      <FileUploader name="docs" value={[]} multiple accept="application/pdf,.png" onChange={handleChange}>
        <FileUploader.DropzoneGroup>
          <FileUploader.Dropzone placeholder="Upload" />
        </FileUploader.DropzoneGroup>
      </FileUploader>,
    );
    const group = document.querySelector<HTMLElement>('[data-slot="file-uploader-dropzone-group"]')!;
    const pdf = new File(['x'], 'scan.pdf', { type: 'application/pdf' });
    const png = new File(['x'], 'photo.png', { type: 'image/png' });
    const exe = new File(['x'], 'setup.exe', { type: 'application/octet-stream' });
    // Not cancelling dragover is what lets the browser open the dropped file in the tab.
    expect(fireEvent.dragOver(group, { dataTransfer: { files: [pdf] } })).toBe(false);
    expect(fireEvent.drop(group, { dataTransfer: { files: [pdf, png, exe] } })).toBe(false);
    expect(handleChange).toHaveBeenCalledWith([pdf, png]);
  });

  it('a disabled zone still swallows a drop, adding nothing', () => {
    const handleChange = vi.fn();
    render(
      <FileUploader name="docs" value={[]} disabled onChange={handleChange}>
        <FileUploader.DropzoneGroup>
          <FileUploader.Dropzone placeholder="Upload" />
        </FileUploader.DropzoneGroup>
      </FileUploader>,
    );
    const group = document.querySelector<HTMLElement>('[data-slot="file-uploader-dropzone-group"]')!;
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    expect(fireEvent.drop(group, { dataTransfer: { files: [file] } })).toBe(false);
    expect(handleChange).not.toHaveBeenCalled();
  });
});

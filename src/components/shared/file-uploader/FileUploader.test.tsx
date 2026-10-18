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
});

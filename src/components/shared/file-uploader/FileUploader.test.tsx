// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { FileUploader } from '@components/shared';

import '../../../i18n';

afterEach(cleanup);

describe('FileUploader.FileList chips', () => {
  it('uses the Tag remove control, named after the file', () => {
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
    expect(handleChange).toHaveBeenCalledWith(null);
  });
});

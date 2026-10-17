// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FileCard } from '@components/shared';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('FileCard parts', () => {
  it('pluralises the folder count noun per language', async () => {
    render(<FileCard.FolderShape count={1} />);
    expect(screen.getByText('document')).toBeTruthy();
    cleanup();

    await act(() => i18n.changeLanguage('ar'));
    render(<FileCard.FolderShape count={2} />);
    expect(screen.getByText('مستند')).toBeTruthy();
  });

  it('translates the default approve and reject labels', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(
      <>
        <FileCard.Approve />
        <FileCard.Reject />
      </>,
    );
    expect(screen.getByRole('button', { name: 'اعتماد' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'رفض' })).toBeTruthy();
  });
});

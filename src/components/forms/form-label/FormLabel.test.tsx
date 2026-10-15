// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormLabel } from '@components/forms';
import { Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

describe('FormLabel tooltip', () => {
  it('the info button is named and does not hand presses to the label', () => {
    render(
      <Tooltip.Provider>
        <FormLabel htmlFor="email" tooltip="We never share it">
          Email
        </FormLabel>
        <input id="email" />
      </Tooltip.Provider>,
    );
    const info = screen.getByRole('button', { name: 'More information' });
    // fireEvent returns false when a handler called preventDefault.
    expect(fireEvent.pointerDown(info)).toBe(false);
    expect(fireEvent.click(info)).toBe(false);
  });
});

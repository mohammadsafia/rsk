// src/components/ui/refs.test.tsx
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Combobox } from '@components/shared';
import { Button, Checkbox, Dialog, IconButton, Input, Textarea } from '@components/ui';

import '../../i18n';

afterEach(cleanup);

describe('refs reach the DOM node without forwardRef', () => {
  it.each([
    [
      'Button',
      () => {
        const ref = createRef<HTMLButtonElement>();
        render(<Button ref={ref}>Save</Button>);
        return [ref.current, 'BUTTON'] as const;
      },
    ],
    [
      'IconButton',
      () => {
        const ref = createRef<HTMLButtonElement>();
        render(
          <IconButton ref={ref} aria-label="Close" tooltip={false}>
            x
          </IconButton>,
        );
        return [ref.current, 'BUTTON'] as const;
      },
    ],
    [
      'Input',
      () => {
        const ref = createRef<HTMLInputElement>();
        render(<Input ref={ref} aria-label="Name" />);
        return [ref.current, 'INPUT'] as const;
      },
    ],
    [
      'Textarea',
      () => {
        const ref = createRef<HTMLTextAreaElement>();
        render(<Textarea ref={ref} aria-label="Notes" />);
        return [ref.current, 'TEXTAREA'] as const;
      },
    ],
    [
      'Checkbox',
      () => {
        const ref = createRef<HTMLButtonElement>();
        render(<Checkbox ref={ref} aria-label="Agree" />);
        return [ref.current, 'BUTTON'] as const;
      },
    ],
  ])('%s', (_, renderIt) => {
    const [node, tag] = renderIt();
    expect(node?.tagName).toBe(tag);
  });

  it('through compound statics: Dialog.Content', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Dialog defaultOpen>
        <Dialog.Content ref={ref} title="Edit">
          Body
        </Dialog.Content>
      </Dialog>,
    );
    expect(ref.current?.getAttribute('role')).toBe('dialog');
  });

  it('through asChild composition: Button asChild keeps the child ref', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Button asChild>
        <a ref={ref} href="#x">
          Go
        </a>
      </Button>,
    );
    expect(ref.current?.tagName).toBe('A');
  });

  it('through Combobox.Trigger', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Combobox>
        <Combobox.Trigger ref={ref}>Pick</Combobox.Trigger>
      </Combobox>,
    );
    fireEvent.click(screen.getByRole('combobox'));
    expect(ref.current?.getAttribute('role')).toBe('combobox');
  });
});

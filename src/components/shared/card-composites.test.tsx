// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { GridCard } from '@components/shared';

import '../../i18n';

afterEach(cleanup);

const header = () => document.querySelector('[data-slot="card-header"]') as HTMLElement;

describe('shared cards keep their own header look', () => {
  it('GridCard header opts out of the Card header hairline and padding', () => {
    render(
      <GridCard.Item>
        <GridCard.Header>
          <GridCard.Title>Visits</GridCard.Title>
        </GridCard.Header>
        <GridCard.Content>12</GridCard.Content>
      </GridCard.Item>,
    );
    expect(header().className).toContain('not-last:border-b-0');
    expect(header().className).toContain('not-last:pb-0');
  });
});

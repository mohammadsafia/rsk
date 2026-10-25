import { Spinner } from '@components/ui';

/** While a signed-in page loads: the shell stays, a labelled spinner where the page will be. */
export default function Loading() {
  return <Spinner overlay size="lg" />;
}

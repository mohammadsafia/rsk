import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { Spinner } from '@components/ui';

const App = () => {
  return (
    <Suspense fallback={<Spinner overlay fixed size="lg" />}>
      <Outlet />
    </Suspense>
  );
};

export default App;

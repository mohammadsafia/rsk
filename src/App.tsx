import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { PrimeLoader } from '@components/shared';

const App = () => {
  return (
    <Suspense fallback={<PrimeLoader displayLogo={false} />}>
      <Outlet />
    </Suspense>
  );
};

export default App;

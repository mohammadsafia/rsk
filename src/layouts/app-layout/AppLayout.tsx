import { Outlet } from 'react-router';

import { AppLayoutShell } from './AppLayoutShell';

/** The Vite app's signed-in layout: the shell around the matched route. */
function AppLayout() {
  return (
    <AppLayoutShell>
      <Outlet />
    </AppLayoutShell>
  );
}

export default AppLayout;

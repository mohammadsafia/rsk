import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { PrimeLoader, Toaster } from '@components/shared';

import { DashboardHeader, DashboardSidebar } from '@layouts';

function DashboardLayout() {
  return (
    <div className="bg-muted-100 flex h-dvh flex-col overflow-hidden md:flex-row">
      <DashboardSidebar />

      <div className="flex h-dvh flex-1 flex-col overflow-hidden">
        <DashboardHeader />

        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          <Suspense fallback={<PrimeLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <Toaster />
    </div>
  );
}

export default DashboardLayout;

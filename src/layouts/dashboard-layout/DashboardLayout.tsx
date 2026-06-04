import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { CommandPalette, PrimeLoader, Toaster } from '@components/shared';

import { CommandPaletteProvider } from '@contexts';

import { DashboardHeader, DashboardSidebar } from '@layouts';

function DashboardLayout() {
  return (
    <CommandPaletteProvider>
      <div className="bg-secondary flex h-dvh flex-col gap-2 overflow-hidden p-2 md:flex-row">
        <DashboardSidebar />

        <div className="bg-background border-border flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm">
          <DashboardHeader />

          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            <Suspense fallback={<PrimeLoader />}>
              <Outlet />
            </Suspense>
          </main>
        </div>

        <Toaster />

        <CommandPalette />
      </div>
    </CommandPaletteProvider>
  );
}

export default DashboardLayout;

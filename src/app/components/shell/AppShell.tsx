import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { OfflineBanner } from './OfflineBanner';
import { VacciBotFAB } from './VacciBotFAB';

export function AppShell() {
  return (
    <div className="min-h-screen flex bg-stone-50 flex-col">
      <OfflineBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <Header />
          <main className="flex-1 p-6 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
      <VacciBotFAB />
    </div>
  );
}

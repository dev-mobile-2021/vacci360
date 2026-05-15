import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { OfflineBanner } from './OfflineBanner';
import { VacciBotFAB } from './VacciBotFAB';

/** Scrolls the main content area to top on every route change. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    const main = document.getElementById('main-scroll');
    if (main) main.scrollTop = 0;
  }, [pathname]);
  return null;
}

export function AppShell() {
  return (
    <div className="min-h-screen flex bg-stone-50 flex-col">
      <OfflineBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <Header />
          <main
            id="main-scroll"
            className="flex-1 overflow-y-auto overflow-x-hidden"
          >
            <ScrollToTop />
            <div className="px-6 py-5 min-h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <VacciBotFAB />
    </div>
  );
}

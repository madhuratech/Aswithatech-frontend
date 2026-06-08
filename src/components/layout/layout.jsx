import { Outlet } from 'react-router-dom';
import Navbar from './navbar'; 
import Footer from './footer';

export default function Layout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900">
      
      <header className="flex-none h-16 w-full bg-white shadow-sm border-b border-slate-200 z-50">
        <Navbar />
      </header>

      <main className="flex-1 w-full overflow-y-auto relative">
        <div className="flex flex-col min-h-full w-full mx-auto max-w-screen-2xl">
          <div className="flex-grow">
            <Outlet />
          </div>
          
          {/* Footer on mobile/tablet (inside scroll) */}
          <div className="block lg:hidden">
            <Footer />
          </div>
        </div>
      </main>

      {/* Footer on large screens (always visible at bottom) */}
      <div className="hidden lg:block flex-none">
        <Footer />
      </div>
      
    </div>
  );
}




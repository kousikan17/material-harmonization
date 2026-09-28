import * as React from "react";
import { Outlet } from "react-router-dom";

import { GovernmentFooter } from "@/components/GovernmentFooter";
import { Topbar } from "@/components/Topbar";

export function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-navy-900">
      <Topbar />
      <main id="main-content" className="flex-1 overflow-y-auto px-4 py-8 md:px-8 lg:px-12 xl:px-24">
        <Outlet />
      </main>
      <GovernmentFooter />
    </div>
  );
}

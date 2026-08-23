import { Outlet } from "react-router";
import { TopBar } from "./TopBar";
import { NavRail } from "./NavRail";
import { ToastViewport } from "./Toast";

export function AppLayout() {
  return (
    <div className="h-full flex flex-col">
      <TopBar />
      <div className="flex-1 flex min-h-0">
        <NavRail />
        <main className="flex-1 min-w-0 overflow-auto">
          <Outlet />
        </main>
      </div>
      <ToastViewport />
    </div>
  );
}

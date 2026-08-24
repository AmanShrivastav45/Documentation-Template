import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { TopBar } from "./TopBar";
import { NavRail } from "./NavRail";
import { ToastViewport } from "./Toast";
import { ShortcutOverlay } from "./ShortcutOverlay";

export function AppLayout() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (e.key === "?" && !isTyping) setShortcutsOpen(true);
      if (e.key === "Escape") setShortcutsOpen(false);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <TopBar onOpenShortcuts={() => setShortcutsOpen(true)} />
      <div className="flex-1 flex min-h-0">
        <NavRail />
        <main className="flex-1 min-w-0 overflow-auto max-md:pb-14">
          <Outlet />
        </main>
      </div>
      <ToastViewport />
      <ShortcutOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}

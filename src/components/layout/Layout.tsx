// App shell: 64px navbar over three columns — sidebar, content, on-this-page.
// Wraps doc pages in MDXProvider so markdown renders with our components.
import { Suspense, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MDXProvider } from "@mdx-js/react";
import { mdxComponents } from "@/components/mdx";
import Sidebar from "@/components/layout/Sidebar";
import Breadcrumb from "@/components/layout/Breadcrumb";
import OnThisPage from "@/components/layout/OnThisPage";
import ThemeToggle from "@/components/layout/ThemeToggle";

export default function Layout() {
  const contentRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-white px-5 dark:border-line-dark dark:bg-canvas-dark">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brandorange font-heading text-sm font-bold text-white">
            D
          </span>
          <span className="font-heading text-lg font-semibold">Docroom</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main ref={contentRef} className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[780px] px-12 py-12">
            <Breadcrumb />
            <MDXProvider components={mdxComponents}>
              <Suspense fallback={null}>
                <Outlet />
              </Suspense>
            </MDXProvider>
          </div>
        </main>
        <OnThisPage contentRef={contentRef} />
      </div>
    </div>
  );
}

// Route table: one lazy route per discovered doc, all inside the 3-column
// Layout. Routes are generated from the filesystem — nothing to register here.
import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { docRoutes, firstDocPath } from "@/lib/docs";

const pages = docRoutes.map(({ path, load }) => ({
  path,
  Page: lazy(load),
}));

const hasRootDoc = pages.some((p) => p.path === "/");

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {!hasRootDoc && (
          <Route path="/" element={<Navigate to={firstDocPath} replace />} />
        )}
        {pages.map(({ path, Page }) => (
          <Route key={path} path={path} element={<Page />} />
        ))}
        <Route
          path="*"
          element={<p className="text-soft dark:text-soft-dark">Page not found.</p>}
        />
      </Route>
    </Routes>
  );
}

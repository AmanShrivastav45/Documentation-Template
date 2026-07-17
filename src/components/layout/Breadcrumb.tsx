// "Documentation > Section > Page" trail derived from the current route and
// the doc tree. Parents link when they have a page; the last crumb is plain.
import { Link, useLocation } from "react-router-dom";
import { ancestorsOf } from "@/lib/docs";

export default function Breadcrumb() {
  const { pathname } = useLocation();
  const chain = ancestorsOf(pathname);
  if (chain.length === 0) return null;

  const crumbs = [{ title: "Documentation", path: "/", hasPage: true }, ...chain];

  return (
    <nav aria-label="Breadcrumb" className="mb-8 text-sm">
      <ol className="flex flex-wrap items-center gap-2">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-2">
              {i > 0 && <span className="text-soft dark:text-soft-dark">&gt;</span>}
              {last ? (
                <span className="text-ink dark:text-ink-dark">{crumb.title}</span>
              ) : crumb.hasPage ? (
                <Link to={crumb.path} className="text-accent hover:underline dark:text-accent-dark">
                  {crumb.title}
                </Link>
              ) : (
                <span className="text-soft dark:text-soft-dark">{crumb.title}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

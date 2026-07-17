// Right-hand table of contents: lists the current page's h2/h3 headings and
// highlights the section in view via IntersectionObserver. Hidden below 1280px.
import { useEffect, useState, type RefObject } from "react";
import { useLocation } from "react-router-dom";

interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

interface OnThisPageProps {
  contentRef: RefObject<HTMLElement>;
}

export default function OnThisPage({ contentRef }: OnThisPageProps) {
  const { pathname } = useLocation();
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState("");

  // Re-scan headings after each route's MDX chunk renders.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const scan = () =>
      setHeadings(
        Array.from(el.querySelectorAll<HTMLElement>("h2[id], h3[id]")).map((h) => ({
          id: h.id,
          text: h.textContent ?? "",
          level: h.tagName === "H2" ? 2 : 3,
        })),
      );
    scan();
    const observer = new MutationObserver(scan);
    observer.observe(el, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [contentRef, pathname]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || headings.length === 0) return;
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const current = headings.find((h) => visible.has(h.id));
        if (current) setActiveId(current.id);
      },
      { root: el, rootMargin: "0px 0px -55% 0px" },
    );
    headings.forEach((h) => {
      const target = document.getElementById(h.id);
      if (target) io.observe(target);
    });
    return () => io.disconnect();
  }, [contentRef, headings]);

  if (headings.length === 0) return <div className="hidden w-[260px] shrink-0 xl:block" />;

  return (
    <aside className="hidden w-[260px] shrink-0 overflow-y-auto py-12 pl-2 pr-6 xl:block">
      <h2 className="mb-3 font-heading text-[15px] font-semibold">On this page</h2>
      <ul className="space-y-2 border-l border-line text-sm dark:border-line-dark">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: h.level === 3 ? 24 : 12 }}>
            <a
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className={
                activeId === h.id
                  ? "text-accent dark:text-accent-dark"
                  : "text-soft hover:text-ink dark:text-soft-dark dark:hover:text-ink-dark"
              }
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

import { NavLink } from "react-router";

const ITEMS = [
  { to: "/", label: "Compare", icon: "⇄" },
  { to: "/sources", label: "Sources", icon: "▤" },
  { to: "/ask", label: "Ask", icon: "?" },
  { to: "/history", label: "History", icon: "↺" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

export function NavRail() {
  return (
    <nav className="group w-[72px] hover:w-[200px] focus-within:w-[200px] transition-[width] duration-base max-md:!w-full max-md:h-14 max-md:fixed max-md:bottom-0 max-md:left-0 max-md:z-30 max-md:flex-row max-md:justify-around max-md:border-t max-md:border-r-0 shrink-0 bg-surface border-r border-hairline-strong flex flex-col py-md max-md:py-0 overflow-hidden">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `h-14 flex flex-col group-hover:flex-row group-focus-within:flex-row items-center justify-center group-hover:justify-start group-focus-within:justify-start gap-xxs group-hover:gap-sm group-focus-within:gap-sm group-hover:px-lg group-focus-within:px-lg border-l-2 max-md:border-l-0 max-md:border-t-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              isActive ? "border-accent text-ink" : "border-transparent text-mute"
            } hover:text-ink`
          }
        >
          <span aria-hidden="true" className="text-lg leading-none shrink-0">
            {item.icon}
          </span>
          <span className="text-label-sm max-md:hidden whitespace-nowrap">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

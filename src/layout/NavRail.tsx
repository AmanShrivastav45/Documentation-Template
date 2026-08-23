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
    <nav className="w-[72px] shrink-0 bg-surface border-r border-hairline-strong flex flex-col py-md">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `h-14 flex flex-col items-center justify-center gap-xxs border-l-2 ${
              isActive ? "border-accent text-ink" : "border-transparent text-mute"
            } hover:text-ink`
          }
        >
          <span aria-hidden="true" className="text-lg leading-none">
            {item.icon}
          </span>
          <span className="text-label-sm">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

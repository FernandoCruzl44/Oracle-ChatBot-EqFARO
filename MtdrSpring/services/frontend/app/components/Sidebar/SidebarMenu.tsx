// app/components/SidebarMenu.tsx
import { Link, useLocation } from "react-router";

export default function SidebarMenu({ isExpanded = true }) {
  const location = useLocation();

  const menuItems = [
    { path: "/", icon: "list-ul", label: "Tareas", disabled: false },
    {
      path: "/productivity",
      icon: "line-chart",
      label: "Productividad",
      disabled: false,
    },
    { path: "/team", icon: "users", label: "Mi Equipo", disabled: true },
  ];

  return (
    <div className="mt-4">
      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`mx-2 flex max-h-[40px] min-w-[40px] items-center rounded-lg px-3 py-2.5 transition-colors select-none ${
              location.pathname === item.path ||
              (item.path === "/" && location.pathname === "")
                ? "bg-oc-amber/20 text-oc-amber"
                : "hover:bg-oc-amber/10 active:bg-oc-amber/30"
            } ${item.disabled ? "cursor-not-allowed opacity-50" : ""}`}
            title={!isExpanded ? item.label : undefined}
            {...(item.disabled ? { onClick: (e) => e.preventDefault() } : {})}
          >
            <i className={`fa fa-${item.icon} w-6 flex-shrink-0`}></i>
            <span
              className={`ml-2 transition-all duration-200 ${
                isExpanded ? "" : "w-0 overflow-hidden opacity-0"
              }`}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

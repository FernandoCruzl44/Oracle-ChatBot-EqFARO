// app/components/SidebarMenu.tsx
import { Link, useLocation } from "react-router";

export default function SidebarMenu() {
  const location = useLocation();

  const menuItems = [
    { path: "/", icon: "list-ul", label: "Tareas" },
    { path: "/team", icon: "users", label: "Mi Equipo" },
    { path: "/productivity", icon: "line-chart", label: "Productividad" },
  ];

  return (
    <div className="mt-4">
      <div className="px-4 text-[#A59A92] text-sm font-semibold mb-2">Menu</div>
      <nav>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-2.5 rounded-lg m-2 transition-colors ${
              location.pathname === item.path ||
              (item.path === "/" && location.pathname === "")
                ? "bg-oc-amber/20 text-oc-amber"
                : "hover:bg-oc-amber/10"
            }`}
          >
            <i className={`fa fa-${item.icon} w-6`}></i>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

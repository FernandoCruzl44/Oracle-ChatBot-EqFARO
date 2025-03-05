// app/components/Sidebar.tsx
import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";
import SidebarProfile from "./SidebarProfile";

export default function Sidebar() {
  return (
    <div className="w-56 h-full bg-oc-brown text-white flex flex-col text-sm">
      <SidebarHeader />
      <SidebarMenu />
      <div className="flex-grow"></div>
      <SidebarProfile />
    </div>
  );
}

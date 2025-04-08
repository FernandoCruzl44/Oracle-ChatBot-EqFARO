// app/components/Sidebar.tsx
import { useEffect } from "react";
import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";
import SidebarProfile from "./SidebarProfile";
import useTaskStore from "~/store";

export default function Sidebar() {
  const isSidebarExpanded = useTaskStore((state) => state.isSidebarExpanded);
  const toggleSidebar = useTaskStore((state) => state.toggleSidebar);

  return (
    <div
      className={`bg-oc-primary border-oc-outline-light flex h-full flex-col border-r-1 text-sm text-white transition-all duration-100 ease-out ${
        isSidebarExpanded ? "w-56" : "w-[3.5rem]"
      }`}
    >
      <button
        onClick={toggleSidebar}
        className="bg-oc-primary border-oc-outline-light hover:bg-oc-amber/20 hover:text-oc-amber group absolute top-3 left-2 z-10 flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-lg border text-white transition-colors"
      >
        <i
          className={`fa fa-chevron-${
            isSidebarExpanded ? "left" : "right"
          } text-xs transition-transform group-active:scale-80`}
        ></i>
      </button>

      <SidebarHeader isExpanded={isSidebarExpanded} />
      <SidebarMenu isExpanded={isSidebarExpanded} />
      <div className="flex-grow"></div>
      <SidebarProfile isExpanded={isSidebarExpanded} />
    </div>
  );
}

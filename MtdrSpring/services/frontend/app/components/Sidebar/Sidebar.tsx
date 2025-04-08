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
      className={`h-full bg-oc-primary text-white flex flex-col text-sm border-r-1 border-oc-outline-light transition-all duration-100 ease-out ${
        isSidebarExpanded ? "w-56" : "w-[3.5rem]"
      }`}
    >
      <button
        onClick={toggleSidebar}
        className="absolute left-2 top-3 flex justify-center items-center w-[40px] h-[40px] bg-oc-primary text-white rounded-lg border border-oc-outline-light cursor-pointer hover:bg-oc-amber/20 hover:text-oc-amber transition-colors z-10 group"
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

// app/components/Sidebar.tsx
import { useState } from "react";
import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";
import SidebarProfile from "./SidebarProfile";

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`h-full bg-oc-primary text-white flex flex-col text-sm border-r-1 border-oc-outline-light transition-all duration-100 ease-out ${
        isExpanded ? "w-56" : "w-[3.5rem]"
      }`}
    >
      <button
        onClick={toggleSidebar}
        className="absolute left-2 top-3 flex justify-center items-center w-[40px] h-[40px] bg-oc-primary text-white rounded-lg border border-oc-outline-light cursor-pointer hover:bg-oc-amber/20 hover:text-oc-amber transition-colors z-10"
      >
        <i
          className={`fa fa-chevron-${isExpanded ? "left" : "right"} text-xs`}
        ></i>
      </button>

      <SidebarHeader isExpanded={isExpanded} />
      <SidebarMenu isExpanded={isExpanded} />
      <div className="flex-grow"></div>
      <SidebarProfile isExpanded={isExpanded} />
    </div>
  );
}

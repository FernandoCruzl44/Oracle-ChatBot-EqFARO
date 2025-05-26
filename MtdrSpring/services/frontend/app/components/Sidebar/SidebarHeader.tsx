import useTaskStore from "~/store";

interface SidebarHeaderProps {
  isExpanded?: boolean;
}

export default function SidebarHeader({
  isExpanded = true,
}: SidebarHeaderProps) {
  const { currentUser } = useTaskStore();

  return (
    <div className="m-5 mt-3 ml-14 flex h-[40px] items-center rounded-md py-2">
      <img
        src="/favicon.ico"
        alt="Logo"
        style={{ imageRendering: "pixelated" }}
        className={`min-h-[40px] min-w-[40px] flex-shrink-0 p-1.5 ${
          !isExpanded ? "opacity-100" : "opacity-100"
        } `}
      />
      <div
        className={`items-left ml-1 justify-center -space-y-1 overflow-hidden transition-opacity duration-200 ${
          !isExpanded ? "w-0 opacity-0" : "opacity-100"
        }`}
      >
        <div className="font-medium whitespace-nowrap">
          {currentUser?.teamName}
        </div>
        {/* <div className="text-xs whitespace-nowrap text-stone-300">
          Placeholder
        </div> */}
        <div className="text-xs whitespace-nowrap text-stone-300">
          {currentUser?.role === "manager" ? "Manager" : "Developer"}
        </div>
      </div>
    </div>
  );
}

// app/components/SidebarHeader.tsx
interface SidebarHeaderProps {
  isExpanded?: boolean;
}

export default function SidebarHeader({
  isExpanded = true,
}: SidebarHeaderProps) {
  return (
    <div className="flex items-center h-[40px] ml-14 mt-3 m-5 py-2 rounded-md">
      <img
        src="/favicon.ico"
        alt="Logo"
        style={{ imageRendering: "pixelated" }}
        className={`min-w-[40px] min-h-[40px] flex-shrink-0 p-1.5  ${
          !isExpanded ? "opacity-100" : "opacity-100"
        } `}
      />
      <div
        className={`ml-1 -space-y-1 items-left justify-center overflow-hidden transition-opacity duration-200 ${
          !isExpanded ? "opacity-0 w-0" : "opacity-100"
        }`}
      >
        <div className="font-medium whitespace-nowrap">Faro</div>
        <div className="text-xs text-stone-300 whitespace-nowrap">Equipo 2</div>
      </div>
    </div>
  );
}

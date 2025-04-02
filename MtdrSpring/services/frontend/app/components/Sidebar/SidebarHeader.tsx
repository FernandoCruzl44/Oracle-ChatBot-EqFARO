// app/components/SidebarHeader.tsx
export default function SidebarHeader() {
  return (
    <div className="p-4 flex items-center">
      {/* <div className="w-10 h-10 rounded-md bg-oc-red flex items-center justify-center mr-3">
        <span className="text-white font-medium">F</span>
      </div> */}
      <img
        src="/favicon.ico"
        alt="Logo"
        style={{ imageRendering: "pixelated" }}
        className="w-10 h-10 rounded-md bg-[#D13B3B] flex items-center justify-center mr-3 p-1.5"
      />
      <div>
        <div className="font-medium">Faro</div>
        <div className="text-sm text-stone-300">Equipo 2</div>
      </div>
    </div>
  );
}

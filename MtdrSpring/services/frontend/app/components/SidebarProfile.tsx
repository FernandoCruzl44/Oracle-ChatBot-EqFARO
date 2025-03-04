// app/components/SidebarProfile.tsx
export default function SidebarProfile() {
  return (
    <div className="p-3 flex items-center hover:bg-oc-amber/12 cursor-pointer m-3 rounded-xl transition-colors">
      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
        <i className="fa fa-user text-gray-600"></i>
      </div>
      <div className="flex-1">
        <div className="font-medium">Rodolfo</div>
        <div className="text-xs text-gray-400">rodolfo@aol.com</div>
      </div>
      <button className="text-gray-400">
        <i className="fa fa-exchange-alt"></i>
      </button>
    </div>
  );
}

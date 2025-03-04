// app/routes/_layout.tsx
import { Outlet } from "react-router";
import Sidebar from "../components/Sidebar";

export default function HomeLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

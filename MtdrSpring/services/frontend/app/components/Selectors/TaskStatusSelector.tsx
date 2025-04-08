import { useState, useEffect, useRef } from "react";

interface TaskStatusSelectorProps {
  status: string;
  onStatusChange: (newStatus: string) => void;
  isLoading?: boolean;
}

export default function TaskStatusSelector({
  status,
  onStatusChange,
  isLoading = false,
}: TaskStatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const statuses = ["Backlog", "En progreso", "Completada", "Cancelada"];

  const buttonClasses = `rounded-lg  flex items-center text-sm ${
    isLoading ? "opacity-50 cursor-not-allowed" : ""
  }`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${buttonClasses} justify-between text-white`}
        disabled={isLoading}
      >
        <span className="truncate">{status}</span>
        <i
          className={`fa fa-chevron-down ml-2 text-xs transition-transform ${
            isOpen ? "rotate-180 transform" : ""
          }`}
        ></i>
      </button>

      {isOpen && (
        <div className="bg-oc-primary border-oc-outline-light absolute z-[100] mt-1 w-56 rounded-lg border shadow-lg dark:border-stone-600">
          <div className="space-y-1 px-1 py-1">
            {statuses.map((statusOption) => (
              <button
                key={statusOption}
                onClick={() => {
                  onStatusChange(statusOption);
                  setIsOpen(false);
                }}
                className={`w-full rounded px-4 py-2 text-left text-sm ${
                  status === statusOption
                    ? "bg-stone-700 text-blue-400"
                    : "text-white hover:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-600"
                }`}
              >
                {statusOption}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

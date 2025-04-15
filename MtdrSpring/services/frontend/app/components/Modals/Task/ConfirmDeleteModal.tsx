import { useState, useEffect, useRef } from "react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tasksCount: number;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  tasksCount,
}: ConfirmDeleteModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 150);
  };

  const handleConfirm = () => {
    setIsVisible(false);
    setTimeout(() => {
      onConfirm();
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs transition-opacity duration-150 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        ref={modalRef}
        className={`bg-oc-primary border-oc-outline-light w-96 rounded-lg border p-6 shadow-lg transition-all duration-150 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <h3 className="mb-4 text-xl font-bold text-white">¿Estás seguro?</h3>
        <p className="mb-6 text-sm text-white">
          Estás a punto de eliminar {tasksCount}{" "}
          {tasksCount === 1 ? "tarea" : "tareas"}. Esta acción no se puede
          deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="rounded-lg border border-stone-500 px-4 py-2 text-sm text-white hover:bg-stone-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-lg border border-red-500 bg-red-900/30 px-4 py-2 text-sm text-red-400 hover:bg-red-900/50"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

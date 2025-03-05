import { useState, useEffect } from "react";

interface Task {
  id: number;
  title: string;
  tag: "Feature" | "Issue";
  status: string;
  startDate: string;
  endDate: string | null;
  createdBy: string;
  description?: string;
}

interface CreateTaskModalProps {
  onClose: () => void;
  onSave: (task: Task) => void;
}

export default function CreateTaskModal({
  onClose,
  onSave,
}: CreateTaskModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState<"Feature" | "Issue">("Feature");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsVisible(false);
    setTimeout(onClose, 150);
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id: Date.now(),
      title,
      tag,
      status: "Backlog",
      startDate,
      endDate,
      createdBy,
      description,
    };

    fetch("/api/tasks/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    })
      .then((response) => response.json())
      .then((data) => {
        onSave(data);
        handleClose();
      })
      .catch((error) => console.error("Error creating task:", error));
  };

  return (
    <div
      className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-opacity duration-150 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`rounded-lg w-full max-w-2xl p-6 bg-[#EFEDE9] transition-transform duration-150 ${
          isVisible ? "translate-y-0" : "translate-y-3"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Crear Nueva Tarea</h2>
          <button
            onClick={handleClose}
            className="border border-oc-outline-light w-7 h-7 rounded flex items-center justify-center hover:bg-oc-neutral text-gray-500 hover:text-gray-700"
          >
            <i className="fa fa-times text-xl"></i>
          </button>
        </div>
        <form onSubmit={handleSubmitTask} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la tarea"
            className="w-full border border-oc-outline-light/60 rounded-lg p-3 text-sm bg-oc-primary"
            required
          />
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value as "Feature" | "Issue")}
            className="w-full border border-oc-outline-light/60 rounded-lg p-3 text-sm bg-oc-primary"
          >
            <option value="Feature">Feature</option>
            <option value="Issue">Issue</option>
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Fecha de inicio"
            className="w-full border border-oc-outline-light/60 rounded-lg p-3 text-sm bg-oc-primary"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Fecha fin"
            className="w-full border border-oc-outline-light/60 rounded-lg p-3 text-sm bg-oc-primary"
          />
          <input
            type="text"
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            placeholder="Creada por"
            className="w-full border border-oc-outline-light/60 rounded-lg p-3 text-sm bg-oc-primary"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción (Opcional)"
            className="w-full border border-oc-outline-light/60 bg-oc-primary rounded-lg p-3 text-sm min-h-[80px]"
          ></textarea>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-oc-primary hover:bg-white rounded-lg border border-oc-outline-light flex items-center text-black text-sm"
            >
              Crear Tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

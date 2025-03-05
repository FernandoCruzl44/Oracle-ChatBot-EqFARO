// app/components/TaskModal.tsx
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

interface Comment {
  created_by: string;
  content: string;
  isCurrentUser?: boolean;
}

interface TaskModalProps {
  task?: Task;
  onClose: () => void;
  isNewTask?: boolean;
  onSave?: (task: Task) => void;
}

export default function TaskModal({
  task,
  onClose,
  isNewTask,
  onSave,
}: TaskModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger modal animation on mount.
    setIsVisible(true);
  }, []);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 150); // Match the transition duration.
  };

  if (isNewTask) {
    // ----- Create New Task Mode -----
    const [title, setTitle] = useState("");
    const [tag, setTag] = useState<"Feature" | "Issue">("Feature");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [createdBy, setCreatedBy] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmitTask = (e: React.FormEvent) => {
      e.preventDefault();
      // Build the new task object.
      const newTask: Task = {
        id: Date.now(), // For demonstration, using timestamp as a temporary id.
        title,
        tag,
        status: "Backlog",
        startDate,
        endDate,
        createdBy,
        // If your Task type supports a description, include it.
        description,
      };
      // Call the POST /tasks/ endpoint.
      fetch("/api/tasks/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      })
        .then((response) => response.json())
        .then((data) => {
          onSave && onSave(data);
          handleClose();
        })
        .catch((error) => console.error("Error creating task:", error));
    };

    return (
      <div
        className={`fixed inset-0 bg-black/60 shadow-lg flex items-center justify-center z-50 transition-opacity ease-out duration-150 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
        style={{ willChange: "opacity" }}
      >
        <div
          className={`rounded-lg w-full max-w-2xl p-6 bg-[#EFEDE9] transition-transform ease-out duration-150 ${
            isVisible ? "translate-y-0" : "translate-y-3"
          }`}
          onClick={(e) => e.stopPropagation()}
          style={{ willChange: "transform" }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Crear Nueva Tarea</h2>
            <button
              onClick={handleClose}
              className="hover:bg-oc-neutral text-gray-500 hover:text-gray-700 border border-oc-outline-light w-7 h-7 rounded flex items-center justify-center"
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
              className="w-full border border-oc-outline-light/60 rounded-lg p-3 text-sm"
              required
            />
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value as "Feature" | "Issue")}
              className="w-full border border-oc-outline-light/60 rounded-lg p-3 text-sm"
            >
              <option value="Feature">Feature</option>
              <option value="Issue">Issue</option>
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Fecha de inicio"
              className="w-full border border-oc-outline-light/60 rounded-lg p-3 text-sm"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Fecha fin"
              className="w-full border border-oc-outline-light/60 rounded-lg p-3 text-sm"
            />
            <input
              type="text"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              placeholder="Creada por"
              className="w-full border border-oc-outline-light/60 rounded-lg p-3 text-sm"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción (Opcional)"
              className="w-full border border-oc-outline-light/60 bg-white rounded-lg p-3 text-sm min-h-[80px]"
            ></textarea>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-oc-primary hover:bg-white rounded-lg border border-oc-outline-light flex items-center text-black text-sm"
              >
                <span>Crear Tarea</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ----- Existing Task Details and Comments Mode -----
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (task) {
      // Fetch comments for this task from the GET /tasks/{task_id}/comments endpoint.
      fetch(`/api/tasks/${task.id}/comments`)
        .then((response) => response.json())
        .then((data) => setComments(data))
        .catch((error) => console.error("Error fetching comments:", error));
      console.log("Comments fetched:", comments);
    }
  }, [task]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && task) {
      const commentPayload = {
        created_by: "Yo",
        content: newComment,
      };
      // Call POST /tasks/{task_id}/comments to add a comment.
      fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentPayload),
      })
        .then((response) => response.json())
        .then((data) => {
          setComments([...comments, data]);
          setNewComment("");
        })
        .catch((error) => console.error("Error adding comment:", error));
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/60 shadow-lg flex items-center justify-center z-50 transition-opacity ease-out duration-150 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
      style={{ willChange: "opacity" }}
    >
      <div
        className={`rounded-lg w-full max-w-4xl flex h-[68vh] p-2 bg-[#EFEDE9] transition-transform ease-out duration-150 ${
          isVisible ? "translate-y-0" : "translate-y-3"
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{ willChange: "transform" }}
      >
        <div className="bg-oc-primary border border-oc-outline-light relative rounded-lg w-full flex overflow-hidden">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 hover:bg-oc-neutral text-gray-500 hover:text-gray-700 border border-oc-outline-light w-7 h-7 rounded flex items-center justify-center"
          >
            <i className="fa fa-times text-xl"></i>
          </button>
          {/* Left side - Task details */}
          <div className="flex-1 p-8 border-r border-oc-outline-light/60 overflow-hidden">
            <div className="flex flex-col h-full">
              <h2 className="text-lg font-bold border-b border-oc-outline-light/60 pb-3 mb-4">
                {task?.title || "Title"}
              </h2>
              <div className="pt-3 text-sm flex flex-col h-full">
                <div className="space-y-4 flex-1 overflow-y-auto">
                  <div className="flex items-center">
                    <div className="w-32 text-oc-brown/60">
                      <i className="fa fa-tag mr-2 translate-y-1"></i>
                      Tag
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-lg ${
                        task?.tag === "Feature"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {task?.tag}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 text-oc-brown/60">
                      <i className="fa fa-info-circle mr-2 translate-y-1"></i>
                      Estatus
                    </div>
                    <div className="flex items-center">
                      <span>{task?.status}</span>
                      <i className="fa fa-chevron-down ml-2 text-oc-brown"></i>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 text-oc-brown/60">
                      <i className="fa fa-calendar mr-2 translate-y-1"></i>
                      Fecha inicio
                    </div>
                    <div>{task?.startDate}</div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 text-oc-brown/60">
                      <i className="fa fa-calendar mr-2 translate-y-1"></i>
                      Fecha fin
                    </div>
                    <div>{task?.endDate}</div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 text-oc-brown/60">
                      <i className="fa fa-user mr-2 translate-y-1"></i>
                      Creada por
                    </div>
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-oc-neutral rounded-full flex items-center justify-center mr-2">
                        <i className="fa fa-user text-xs"></i>
                      </span>
                      {task?.createdBy}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 text-oc-brown/60">
                      <i className="fa fa-user-plus mr-2 translate-y-1"></i>
                      Asignación
                    </div>
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-oc-neutral rounded-full flex items-center justify-center mr-2">
                        <i className="fa fa-user text-xs"></i>
                      </span>
                      {task?.createdBy}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-oc-brown/60 p-2">
                    Descripción (Opcional)
                  </div>
                  <textarea
                    className="w-full border border-oc-outline-light/60 bg-white rounded-lg p-3 min-h-[120px] text-sm"
                    placeholder="Añadir una descripción..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
          {/* Right side - Comments */}
          <div className="w-[350px] flex flex-col bg-oc-primary">
            <div className="p-8">
              <h3 className="text-lg font-bold border-b border-oc-outline-light/60 pb-3">
                Comentarios
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-4 pl-2">
              {comments.map((comment, index) => (
                <div key={index} className="flex gap-4">
                  <div className="border-r border-oc-outline-light h-full"></div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 bg-oc-neutral rounded-full flex items-center justify-center">
                        <i className="fa fa-user text-xs"></i>
                      </span>
                      <span className="font-medium text-base">
                        {comment.created_by}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 pb-7 mb-2.5">
              <form onSubmit={handleSubmitComment}>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe tu comentario"
                  className="w-full border border-oc-outline-light/60 bg-white rounded-lg p-3 text-sm"
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

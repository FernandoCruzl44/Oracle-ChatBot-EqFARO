// app/components/TaskModal.tsx
import { useState, useEffect } from "react";
import type { Task, Comment as CommentType, User } from "~/types";

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (task: Task) => void;
}

export default function TaskModal({ task, onClose, onUpdate }: TaskModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<CommentType[]>([]);
  const [editableTask, setEditableTask] = useState<Task>({ ...task });
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    console.log("TaskModal received task:", task);
    setIsVisible(true);
    fetch("/api/identity/current")
      .then((res) => res.json())
      .then((data) => {
        if (data.message !== "No identity set") {
          setCurrentUser(data);
        }
      })
      .catch((error) => {
        console.error("Error fetching current user:", error);
      });
  }, []);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsVisible(false);
    setTimeout(onClose, 150);
  };

  useEffect(() => {
    if (task) {
      fetch(`/api/comments/task/${task.id}`)
        .then((response) => response.json())
        .then((data) => {
          console.log("Raw comments data:", data);
          setComments(data);
        })
        .catch((error) => console.error("Error fetching comments:", error));
    }
  }, [task]);

  useEffect(() => {
    setEditableTask(task);
    console.log("Task updated:", task);
  }, [task]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editableTask]);

  const handleInputChange = (field: keyof Task, value: string) => {
    if (value !== task[field as keyof Task]) {
      setIsEditing(true);
      setEditableTask((prev) => ({
        ...prev,
        [field]: value,
      }));
    } else {
      setEditableTask((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSave = async () => {
    try {
      // Prepare task for API submission
      const taskForApi = {
        title: editableTask.title,
        description: editableTask.description || "",
        tag: editableTask.tag,
        status: editableTask.status,
        startDate: editableTask.startDate,
        endDate: editableTask.endDate || null,
        team_id: editableTask.teamId,
      };

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskForApi),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        onUpdate(updatedTask);
        setIsEditing(false);
        handleClose();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      const commentPayload = {
        content: newComment,
      };

      fetch(`/api/comments/task/${task.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentPayload),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("New comment response:", data);
          setComments([...comments, data]);
          setNewComment("");
        })
        .catch((error) => console.error("Error adding comment:", error));
    }
  };

  const deleteComment = (commentId: number) => {
    fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (response.ok) {
          setComments(comments.filter((comment) => comment.id !== commentId));
        }
      })
      .catch((error) => console.error("Error deleting comment:", error));
  };

  return (
    <div
      className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-opacity duration-150 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`rounded-lg w-full max-w-4xl flex h-[650px] p-2 bg-[#EFEDE9] transition-transform duration-150 ${
          isVisible ? "translate-y-0" : "translate-y-3"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-oc-primary border border-oc-outline-light relative rounded-lg w-full flex overflow-hidden">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 border border-oc-outline-light w-7 h-7 rounded flex items-center justify-center hover:bg-oc-neutral text-gray-500 hover:text-gray-700"
          >
            <i className="fa fa-times text-xl"></i>
          </button>
          <div className="flex-1 p-8 border-r border-oc-outline-light/60 overflow-hidden">
            <div className="flex flex-col h-full">
              <input
                type="text"
                value={editableTask.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="text-lg font-bold border-b border-oc-outline-light/60 pb-3 mb-4 bg-transparent focus:outline-none"
              />
              <form
                className="pt-3 text-sm flex flex-col h-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              >
                <div className="space-y-4 flex-1 overflow-y-auto">
                  <div className="flex items-center">
                    <div className="w-32 text-oc-brown/60">
                      <i className="fa fa-tag mr-2 translate-y-1"></i>
                      Tag
                    </div>
                    <select
                      value={editableTask.tag}
                      onChange={(e) =>
                        handleInputChange(
                          "tag",
                          e.target.value as "Feature" | "Issue"
                        )
                      }
                      className={`px-2 py-1 text-xs rounded-lg border border-oc-outline-light/40 ${
                        editableTask.tag === "Feature"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <option value="Feature">Feature</option>
                      <option value="Issue">Issue</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 text-oc-brown/60">
                      <i className="fa fa-info-circle mr-2 translate-y-1"></i>
                      Estatus
                    </div>
                    <select
                      value={editableTask.status}
                      onChange={(e) =>
                        handleInputChange("status", e.target.value)
                      }
                      className="px-2 py-1 text-xs rounded-lg border border-oc-outline-light/40"
                    >
                      <option value="En progreso">En progreso</option>
                      <option value="Cancelada">Cancelada</option>
                      <option value="Backlog">Backlog</option>
                      <option value="Completada">Completada</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 text-oc-brown/60">
                      <i className="fa fa-calendar mr-2 translate-y-1"></i>
                      Fecha inicio
                    </div>
                    <input
                      type="date"
                      value={editableTask.startDate}
                      onChange={(e) =>
                        handleInputChange("startDate", e.target.value)
                      }
                      className="px-2 py-1"
                    />
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 text-oc-brown/60">
                      <i className="fa fa-calendar mr-2 translate-y-1"></i>
                      Fecha fin
                    </div>
                    <input
                      type="date"
                      value={editableTask.endDate || ""}
                      onChange={(e) =>
                        handleInputChange("endDate", e.target.value)
                      }
                      className="px-2 py-1"
                    />
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 text-oc-brown/60">
                      <i className="fa fa-user mr-2 translate-y-1"></i>
                      Creada por
                    </div>
                    <input
                      type="text"
                      value={editableTask.creatorName || "—"}
                      readOnly
                      className="px-2 py-1 bg-gray-100"
                    />
                  </div>
                  {editableTask.teamName && (
                    <div className="flex items-center">
                      <div className="w-32 text-oc-brown/60">
                        <i className="fa fa-users mr-2 translate-y-1"></i>
                        Equipo
                      </div>
                      <input
                        type="text"
                        value={editableTask.teamName || ""}
                        readOnly
                        className="px-2 py-1 bg-gray-100"
                      />
                    </div>
                  )}
                  {editableTask.assignees &&
                    editableTask.assignees.length > 0 && (
                      <div className="flex items-center">
                        <div className="w-32 text-oc-brown/60">
                          <i className="fa fa-user-plus mr-2 translate-y-1"></i>
                          Asignados
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {editableTask.assignees.map((assignee, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs rounded-lg bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              {assignee.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </form>
              <div>
                <textarea
                  className="w-full border bg-white rounded-lg p-3 min-h-[120px] text-sm text-oc-brown border-oc-outline-light/60"
                  placeholder="Descripción (Opcional)"
                  value={editableTask.description || ""}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                ></textarea>
              </div>
              <div className="my-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className={`w-full text-sm py-2.5 bg-oc-brown text-white rounded hover:bg-oc-brown/90 transition-all flex justify-center items-center ${
                    isEditing ? "" : "opacity-50 cursor-not-allowed"
                  }`}
                  disabled={!isEditing}
                >
                  <span>Guardar cambios</span>
                  <span className="ml-2 text-xs flex items-center text-oc-outline-light/80">
                    <i className="fa fa-keyboard mr-1" aria-hidden="true"></i>⌘
                    + Enter / Ctrl + Enter
                  </span>
                </button>
              </div>
            </div>
          </div>
          {/* Derecha - Comentarios */}
          <div className="w-[350px] flex flex-col bg-oc-primary">
            <div className="p-8">
              <h3 className="text-lg font-bold border-b border-oc-outline-light/60 pb-3">
                Comentarios
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-4 pl-2">
              {comments.length === 0 ? (
                <div className="text-center text-gray-500 pt-4">
                  No hay comentarios
                </div>
              ) : (
                comments.map((comment, index) => (
                  <div key={index} className="flex gap-4 group">
                    <div className="border-r border-oc-outline-light h-full"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-oc-neutral rounded-full flex items-center justify-center border border-oc-outline-light/80">
                            <i className="fa fa-user text-xs"></i>
                          </span>
                          <span className="font-medium text-base">
                            {comment.creatorName}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm pl-0.5">{comment.content}</p>
                    </div>
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-500 "
                    >
                      <i className="fa fa-trash text-sm"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 pb-7 mb-2.5">
              <form onSubmit={handleSubmitComment}>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe tu comentario"
                  className="w-full border border-oc-outline-light/60 bg-white rounded-lg p-3 py-2.5 text-sm"
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

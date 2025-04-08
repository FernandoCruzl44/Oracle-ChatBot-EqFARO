// app/components/TaskModal/index.tsx
import { useState, useEffect, useRef } from "react";
import type { Task } from "~/types";
import useTaskStore from "~/store/index";
import { generateAvatarColor } from "~/lib/utils";
import { Modal } from "../../Modal";
import { Button } from "../../Button";
import { TaskMetadata } from "./TaskMetadata";
import { CommentsSection } from "./CommentSection";
import { CommentForm } from "./CommentForm";

interface TaskModalProps {
  task: Task;
  onClose: () => void;
}

export default function TaskModal({ task, onClose }: TaskModalProps) {
  const {
    updateTask,
    getTaskComments,
    getCurrentUser,
    fetchComments,
    addComment,
    deleteComment,
    isLoadingComments,
    sprints,
    getSprintsByTeam,
  } = useTaskStore();

  const [isVisible, setIsVisible] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editableTask, setEditableTask] = useState<Task>({ ...task });
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const comments = getTaskComments(task.id);
  const isLoading = isLoadingComments();
  const teamSprints = editableTask.teamId
    ? getSprintsByTeam(editableTask.teamId)
    : [];

  const currentUser = getCurrentUser();

  useEffect(() => {
    console.log("TaskModal received task:", task);
    setTimeout(() => {
      setIsVisible(true);
    }, 0);

    fetchComments(task.id);
  }, [task, fetchComments]);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsVisible(false);
    setTimeout(onClose, 150);
  };

  useEffect(() => {
    setEditableTask(task);
  }, [task]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && isEditing) {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editableTask]);

  const handleInputChange = (field: keyof Task, value: any) => {
    if (value !== editableTask[field]) {
      setIsEditing(true);
      setEditableTask((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSave = async () => {
    try {
      let estimatedHours = null;
      if (
        editableTask.estimatedHours !== undefined &&
        editableTask.estimatedHours !== null
      ) {
        estimatedHours = Number(editableTask.estimatedHours);
        if (isNaN(estimatedHours)) {
          alert("Las horas estimadas deben ser un número válido");
          return;
        }
      }

      let actualHours = null;
      if (
        editableTask.actualHours !== undefined &&
        editableTask.actualHours !== null
      ) {
        actualHours = Number(editableTask.actualHours);
        if (isNaN(actualHours)) {
          alert("Las horas reales deben ser un número válido");
          return;
        }
      }

      const taskForApi = {
        title: editableTask.title,
        description: editableTask.description || "",
        tag: editableTask.tag,
        status: editableTask.status,
        startDate: editableTask.startDate,
        endDate: editableTask.endDate || null,
        team_id: editableTask.teamId,
        sprint_id: editableTask.sprintId,
        estimated_hours: estimatedHours,
        actual_hours: actualHours,
      };

      await updateTask(task.id, taskForApi);
      setIsEditing(false);
      handleClose();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  useEffect(() => {
    if (!isSubmittingComment && commentInputRef.current) {
      setTimeout(() => {
        commentInputRef.current?.focus();
      }, 50);
    }
  }, [isSubmittingComment]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      setIsSubmittingComment(true);
      addComment(task.id, newComment)
        .then(() => {
          setNewComment("");
        })
        .catch((error) => {
          console.error("Error adding comment:", error);
        })
        .finally(() => {
          setIsSubmittingComment(false);
        });
    }
  };

  const handleDeleteComment = (commentId: number) => {
    deleteComment(commentId, task.id).catch((error) => {
      console.error("Error deleting comment:", error);
    });
  };

  return (
    <Modal
      className="h-[690px] max-h-[690px]"
      isVisible={isVisible}
      onClose={handleClose}
      handleClose={handleClose}
    >
      <div className="border-oc-outline-light/90 flex-1 overflow-hidden border-r p-8">
        <div className="flex h-full flex-col">
          <input
            type="text"
            value={editableTask.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className="border-oc-outline-light/60 mb-4 border-b bg-transparent pb-3 text-lg font-bold text-white focus:outline-none"
          />
          <form
            className="flex flex-col pt-3 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="flex flex-1 gap-4">
              <TaskMetadata
                editableTask={editableTask}
                teamSprints={teamSprints}
                handleInputChange={handleInputChange}
                generateAvatarColor={generateAvatarColor}
              />
            </div>
          </form>
          <div>
            <textarea
              className="bg-oc-neutral/30 text-oc-brown border-oc-outline-light/60 mt-4 h-[120px] max-h-[120px] w-full resize-none overflow-auto rounded-lg border p-3 text-sm"
              placeholder="Descripción (Opcional)"
              value={editableTask.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
            ></textarea>
          </div>
          <Button
            type="button"
            onClick={handleSave}
            isEditing={isEditing}
            disabled={!isEditing}
          >
            <span>Guardar cambios</span>
            <span className="ml-2 flex items-center text-xs opacity-40">
              <i className="fa fa-keyboard mr-1" aria-hidden="true"></i>⌘ +
              Enter / Ctrl + Enter
            </span>
          </Button>
        </div>
      </div>
      <div className="bg-oc-primary flex w-[350px] flex-col">
        <div className="p-8 pb-6.5">
          <h3 className="border-oc-outline-light/60 border-b pb-3 text-lg font-bold text-white">
            Comentarios
          </h3>
        </div>
        <CommentsSection
          comments={comments}
          isLoading={isLoading}
          getCurrentUser={getCurrentUser}
          handleDeleteComment={handleDeleteComment}
        />
        <CommentForm
          newComment={newComment}
          setNewComment={setNewComment}
          handleSubmitComment={handleSubmitComment}
          isSubmittingComment={isSubmittingComment}
          commentInputRef={commentInputRef}
        />
      </div>
    </Modal>
  );
}

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
      <div className="flex-1 p-8 border-r border-oc-outline-light/60 overflow-hidden">
        <div className="flex flex-col h-full">
          <input
            type="text"
            value={editableTask.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className="text-lg text-white font-bold border-b border-oc-outline-light/60 pb-3 mb-4 bg-transparent focus:outline-none"
          />
          <form
            className="pt-3 text-sm flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="flex gap-4 flex-1">
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
              className="w-full border mt-4 bg-oc-neutral/30 rounded-lg p-3 h-[120px] max-h-[120px] text-sm text-oc-brown border-oc-outline-light/60 resize-none overflow-auto"
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
            <span className="ml-2 text-xs flex items-center opacity-40">
              <i className="fa fa-keyboard mr-1" aria-hidden="true"></i>⌘ +
              Enter / Ctrl + Enter
            </span>
          </Button>
        </div>
      </div>
      <div className="w-[350px] flex flex-col bg-oc-primary">
        <div className="p-8 pb-6.5">
          <h3 className="text-lg font-bold border-b text-white border-oc-outline-light/60 pb-3">
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

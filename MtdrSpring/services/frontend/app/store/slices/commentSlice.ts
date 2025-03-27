// app/store/slices/commentSlice.ts
import type { StateCreator } from "zustand";
import type { StoreState, TaskStore } from "~/store/types";
import type { Comment } from "~/types";

export interface CommentSlice extends StoreState {
  comments: Record<number, Comment[]>;
  loading: boolean;

  getTaskComments: (taskId: number) => Comment[];
  isLoadingComments: () => boolean;

  fetchComments: (taskId: number) => Promise<void>;
  addComment: (taskId: number, content: string) => Promise<void>;
  deleteComment: (commentId: number, taskId: number) => Promise<void>;
}

export const createCommentSlice: StateCreator<
  TaskStore,
  [],
  [],
  CommentSlice
> = (set, get) => ({
  comments: {},
  error: null,
  loading: false,

  getTaskComments: (taskId) => {
    return get().comments[taskId] || [];
  },

  isLoadingComments: () => get().loading,

  fetchComments: async (taskId) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/comments/task/${taskId}`);
      if (!response.ok) {
        throw new Error("Error al cargar los comentarios");
      }
      const data = await response.json();

      set((state) => ({
        comments: {
          ...state.comments,
          [taskId]: data,
        },
        loading: false,
      }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error al cargar los comentarios",
        loading: false,
      });
    }
  },

  addComment: async (taskId, content) => {
    try {
      const response = await fetch(`/api/comments/task/${taskId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Error al añadir el comentario");
      }

      const comment = await response.json();

      set((state) => ({
        comments: {
          ...state.comments,
          [taskId]: [...(state.comments[taskId] || []), comment],
        },
      }));
    } catch (error) {
      console.error("Error adding comment:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error al añadir el comentario",
      });
      throw error;
    }
  },

  deleteComment: async (commentId, taskId) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el comentario");
      }

      set((state) => ({
        comments: {
          ...state.comments,
          [taskId]:
            state.comments[taskId]?.filter(
              (comment) => comment.id !== commentId
            ) || [],
        },
      }));
    } catch (error) {
      console.error("Error deleting comment:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error al eliminar el comentario",
      });
      throw error;
    }
  },
});

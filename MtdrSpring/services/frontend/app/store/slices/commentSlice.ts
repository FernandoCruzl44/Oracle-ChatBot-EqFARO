// app/store/slices/commentSlice.ts
import type { StateCreator } from "zustand";
import type { CommentSlice, TaskStore } from "../types";

export const createCommentSlice: StateCreator<
  TaskStore,
  [],
  [],
  CommentSlice
> = (set, get) => ({
  // Initial state
  comments: {},
  error: null,
  loading: false, // Added loading state

  // Getters
  getTaskComments: (taskId) => {
    return get().comments[taskId] || [];
  },

  isLoadingComments: () => get().loading, // Added getter for loading state

  // Actions
  fetchComments: async (taskId) => {
    set({ loading: true }); // Set loading to true when starting
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
        loading: false, // Set loading to false when done
      }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error al cargar los comentarios",
        loading: false, // Set loading to false on error
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

      // Add the comment to the store
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

      // Remove the comment from state
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

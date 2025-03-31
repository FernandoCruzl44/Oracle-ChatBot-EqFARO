// app/components/TaskModal/CommentsSection.tsx
import { generateAvatarColor } from "~/lib/generateAvatarColor";
import { CommentItem } from "./CommentItem";

interface CommentsSectionProps {
  comments: any[];
  isLoading: boolean;
  getCurrentUser: () => any;
  handleDeleteComment: (commentId: number) => void;
}

export function CommentsSection({
  comments,
  isLoading,
  getCurrentUser,
  handleDeleteComment,
}: CommentsSectionProps) {
  const currentUser = getCurrentUser();

  return (
    <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-4 pl-2">
      <div
        className={`relative space-y-4 ${
          isLoading ? "opacity-50" : "opacity-100"
        }`}
      >
        {comments.map((comment, index) => (
          <CommentItem
            key={index}
            comment={comment}
            generateAvatarColor={generateAvatarColor}
            currentUserId={currentUser?.id}
            currentUserRole={currentUser?.role}
            onDelete={handleDeleteComment}
          />
        ))}
        <div
          className={`absolute top-0 right-0 left-0 justify-center items-center text-center text-stone-300 pt-4 transition-opacity duration-200 pointer-events-none ${
            comments.length === 0 && !isLoading ? "opacity-100" : "opacity-0"
          }`}
        >
          No hay comentarios
        </div>
        <div
          className={`absolute top-5 right-0 left-0 flex justify-center items-center transition-opacity pointer-events-none duration-200 ${
            isLoading ? "opacity-100" : "opacity-0"
          }`}
        >
          <i className="fa fa-lg fa-spinner text-oc-brown animate-spin"></i>
        </div>
      </div>
    </div>
  );
}

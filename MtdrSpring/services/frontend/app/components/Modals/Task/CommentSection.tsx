import { useEffect, useRef } from "react";
import { generateAvatarColor } from "~/lib/utils";
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [comments]);

  return (
    <div
      ref={containerRef}
      className="w-full flex-1 overflow-y-auto p-6 px-4 pt-0 pb-0"
    >
      <div
        className={`relative space-y-3 ${
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
          className={`pointer-events-none absolute top-0 right-0 left-0 items-center justify-center pt-4 text-center text-stone-300 transition-opacity duration-200 ${
            comments.length === 0 && !isLoading ? "opacity-100" : "opacity-0"
          }`}
        >
          No hay comentarios
        </div>
        <div
          className={`pointer-events-none absolute top-5 right-0 left-0 flex items-center justify-center transition-opacity duration-200 ${
            isLoading ? "opacity-100" : "opacity-0"
          }`}
        >
          <i className="fa fa-lg fa-spinner text-oc-brown animate-spin"></i>
        </div>
      </div>
    </div>
  );
}

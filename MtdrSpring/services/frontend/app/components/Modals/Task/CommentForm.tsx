// app/components/TaskModal/CommentForm.tsx
interface CommentFormProps {
  newComment: string;
  setNewComment: (comment: string) => void;
  handleSubmitComment: (e: React.FormEvent) => void;
  isSubmittingComment: boolean;
  commentInputRef: React.RefObject<HTMLInputElement | null>;
}

export function CommentForm({
  newComment,
  setNewComment,
  handleSubmitComment,
  isSubmittingComment,
  commentInputRef,
}: CommentFormProps) {
  return (
    <div className="p-4 pb-8 mt-auto">
      <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            ref={commentInputRef}
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe tu comentario"
            className="w-full border border-oc-outline-light/60 bg-oc-neutral/50 hover:bg-black transition-colors text-white placeholder:text-white/40 rounded-lg p-3 py-2.5 text-sm h-[42px]"
            disabled={isSubmittingComment}
          />
        </div>
        <button
          type="submit"
          className={`text-white rounded-lg flex items-center justify-center h-[42px] w-[42px] border border-oc-outline-light/60 transition-colors ${
            newComment.trim()
              ? "bg-stone-50/5 hover:bg-stone-50/20"
              : "bg-oc-neutral/90"
          }`}
          disabled={!newComment.trim() || isSubmittingComment}
        >
          {isSubmittingComment ? (
            <i className="fa fa-spinner animate-spin"></i>
          ) : (
            <i className="fa fa-paper-plane"></i>
          )}
        </button>
      </form>
    </div>
  );
}

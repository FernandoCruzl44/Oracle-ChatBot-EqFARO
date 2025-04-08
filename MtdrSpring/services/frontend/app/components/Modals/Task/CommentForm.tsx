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
    <div className="mt-auto p-4 pb-8">
      <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={commentInputRef}
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe tu comentario"
            className="border-oc-outline-light/60 bg-oc-neutral/50 h-[42px] w-full rounded-lg border p-3 py-2.5 text-sm text-white transition-colors placeholder:text-white/40 hover:bg-black"
            disabled={isSubmittingComment}
          />
        </div>
        <button
          type="submit"
          className={`border-oc-outline-light/60 flex h-[42px] w-[42px] items-center justify-center rounded-lg border text-white transition-colors ${
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

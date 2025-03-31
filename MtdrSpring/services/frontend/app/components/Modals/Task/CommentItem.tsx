// app/components/TaskModal/CommentItem.tsx
interface CommentItemProps {
  comment: any;
  generateAvatarColor: (name: string) => {
    backgroundColor: string;
    color: string;
  };
  currentUserId: number | null;
  currentUserRole: string | null;
  onDelete: (commentId: number) => void;
}

export function CommentItem({
  comment,
  generateAvatarColor,
  currentUserId,
  currentUserRole,
  onDelete,
}: CommentItemProps) {
  const colors = generateAvatarColor(comment.creatorName);
  return (
    <div className="flex gap-4 group transition-opacity">
      <div className="border-r border-oc-outline-light h-full"></div>
      <div className="flex flex-1 border border-oc-outline-light/60 bg-oc-neutral/40 rounded-xl p-2 px-3 relative">
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span
                className="px-1.5 py-0.5 pl-0.5 text-xs border-oc-outline-light/60 whitespace-nowrap font-bold"
                title={comment.creatorName}
                style={{
                  color: colors.backgroundColor,
                }}
              >
                {comment.creatorName}
              </span>
            </div>
          </div>
          <p className="text-sm pl-0.5">{comment.content}</p>
        </div>
        {comment.creatorId === currentUserId ||
        currentUserRole === "manager" ? (
          <button
            onClick={() => onDelete(comment.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 hover:text-stone-100 translate-y-0.5 pr-1"
          >
            <i className="fa fa-trash text-sm"></i>
          </button>
        ) : (
          <div className="w-5 h-5"></div>
        )}
      </div>
    </div>
  );
}

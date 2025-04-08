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
  const isOwnComment = currentUserId === comment.creatorId;
  const canDelete =
    comment.creatorId === currentUserId || currentUserRole === "manager";

  return (
    <div
      className={`group relative flex gap-4 transition-opacity ${
        isOwnComment ? "flex-row-reverse" : ""
      }`}
    >
      <div
        className={`${
          isOwnComment ? "border-l" : "border-r"
        } border-oc-outline-light h-full`}
      ></div>

      <div
        className="absolute top-0 flex h-7 w-7 items-center justify-center rounded-full"
        style={{
          backgroundColor: colors.backgroundColor,
          [isOwnComment ? "right" : "left"]: 0,
        }}
      >
        <i
          className="fa fa-user text-oc-neutral/40"
          style={{
            color: colors.color,
          }}
        ></i>
      </div>

      <div
        className={`border-oc-outline-light/60 relative max-w-[300px] flex-1 rounded-xl border bg-[#181615] p-2 px-3 ${
          isOwnComment ? "mr-5 rounded-tr-none" : "ml-5 rounded-tl-none"
        }`}
      >
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="border-oc-outline-light/60 px-1.5 py-0.5 pl-0.5 text-xs font-bold whitespace-nowrap"
                title={comment.creatorName}
                style={{
                  color: colors.backgroundColor,
                }}
              >
                {isOwnComment ? "" : comment.creatorName}
              </span>
            </div>
          </div>
          <p className="max-w-[250px] pl-0.5 text-sm break-words">
            {comment.content}
          </p>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-oc-brown/50 text-[11px] whitespace-nowrap">
            {new Date(comment.createdAt + "Z").toLocaleString("es-MX", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            })}
          </span>
          {canDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-stone-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-stone-100"
            >
              <i className="fa fa-trash text-sm"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
      className={`flex gap-4 group transition-opacity relative ${
        isOwnComment ? "flex-row-reverse" : ""
      }`}
    >
      <div
        className={`${
          isOwnComment ? "border-l" : "border-r"
        } border-oc-outline-light h-full`}
      ></div>

      <div
        className="w-7 h-7 flex items-center justify-center rounded-full top-0 absolute"
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
        className={`flex-1 border border-oc-outline-light/60 bg-[#181615] rounded-xl p-2 px-3 relative max-w-[300px] ${
          isOwnComment ? "mr-5 rounded-tr-none" : "ml-5 rounded-tl-none"
        }`}
      >
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
                {isOwnComment ? "" : comment.creatorName}
              </span>
            </div>
          </div>
          <p className="text-sm pl-0.5 break-words max-w-[250px]">
            {comment.content}
          </p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-oc-brown/50 whitespace-nowrap">
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
              className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 hover:text-stone-100"
            >
              <i className="fa fa-trash text-sm"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

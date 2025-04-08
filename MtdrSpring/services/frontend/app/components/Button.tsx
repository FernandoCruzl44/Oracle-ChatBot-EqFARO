// app/components/TaskModal/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isEditing?: boolean;
}

export function Button({
  children,
  className = "",
  isEditing = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`bg-oc-neutral/50 border-oc-outline-light/60 mt-auto flex w-full items-center justify-center rounded-lg border py-2.5 text-sm transition-all hover:bg-black ${
        isEditing
          ? "bg-white/80 text-black hover:bg-white"
          : "cursor-not-allowed text-white"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

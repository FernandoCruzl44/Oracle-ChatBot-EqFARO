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
  const baseClassname = `mt-auto w-full text-sm py-2.5 bg-oc-neutral/50 border border-oc-outline-light/60 rounded-lg hover:bg-black transition-all flex justify-center items-center ${
    isEditing
      ? "bg-white/80 hover:bg-white text-black"
      : "cursor-not-allowed text-white"
  }`;
  return (
    <button className={`${baseClassname} ${className}`} {...props}>
      {children}
    </button>
  );
}

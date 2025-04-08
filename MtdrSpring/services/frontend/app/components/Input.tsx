// app/components/TaskModal/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  customClass?: string;
}

export function Input({ customClass = "", ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`border-oc-outline-light/40 bg-oc-neutral/50 w-32 rounded-lg border px-2 py-2 text-xs text-white ${customClass}`}
    />
  );
}

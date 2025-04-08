// app/components/TaskModal/Card.tsx
interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function Card({ children, title, className = "" }: CardProps) {
  return (
    <div
      className={`bg-oc-neutral/30 border-oc-outline-light/60 space-y-4 rounded-xl border p-4 ${className}`}
    >
      {title && <h4 className="text-sm font-bold text-white">{title}</h4>}
      {children}
    </div>
  );
}

// app/components/TaskModal/Card.tsx
interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function Card({ children, title, className = "" }: CardProps) {
  return (
    <div
      className={`space-y-4 p-4 rounded-xl bg-oc-neutral/30 border border-oc-outline-light/60 ${className}`}
    >
      {title && <h4 className="text-sm font-bold text-white">{title}</h4>}
      {children}
    </div>
  );
}

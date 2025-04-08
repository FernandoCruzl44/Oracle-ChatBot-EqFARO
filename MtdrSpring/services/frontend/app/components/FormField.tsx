// app/components/TaskModal/FormField.tsx
interface FormFieldProps {
  label: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  icon,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="text-oc-brown/60 w-32">
        {icon && <i className={`fa fa-${icon} mr-2 translate-y-0.5`}></i>}
        {label}
      </div>
      {children}
    </div>
  );
}

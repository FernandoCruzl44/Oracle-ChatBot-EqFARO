// app/components/TaskModal/Select.tsx
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{
    value: string | number;
    label: string;
  }>;
  className?: string;
  styleByValue?: {
    getClassName: (value: string) => string;
  };
}

export function Select({
  options,
  className = "",
  styleByValue,
  ...props
}: SelectProps) {
  const value = props.value?.toString() || "";

  return (
    <select
      {...props}
      className={`px-2 py-2 my-[1px] text-xs rounded-lg outline min-w-32 border-r-5 border-transparent ${
        styleByValue
          ? styleByValue.getClassName(value)
          : "text-white outline-oc-outline-light/40 bg-oc-neutral/50"
      } ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

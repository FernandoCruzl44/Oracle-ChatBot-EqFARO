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
      className={`my-[1px] min-w-32 rounded-lg border-r-5 border-transparent px-2 py-2 text-xs outline ${
        styleByValue
          ? styleByValue.getClassName(value)
          : "outline-oc-outline-light/40 bg-oc-neutral/50 text-white"
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

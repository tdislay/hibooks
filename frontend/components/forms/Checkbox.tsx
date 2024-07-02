import { ReactElement } from "react";

export default function Checkbox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (checked: boolean) => void;
}): ReactElement {
  return (
    <label className="space-x-2">
      <input
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        type="checkbox"
        className="accent-blue-600"
      />
      <span>{label}</span>
    </label>
  );
}

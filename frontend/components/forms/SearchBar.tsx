import { ReactElement } from "react";

export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}): ReactElement {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="p-2 w-full rounded-lg border border-gray-300 transition-colors duration-200 outline-none hover:border-blue-600 focus:border-blue-700"
      type="text"
      placeholder="Search books, authors, series..."
    />
  );
}

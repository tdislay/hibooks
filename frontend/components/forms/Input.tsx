"use client";

import {
  ChangeEventHandler,
  HTMLInputTypeAttribute,
  ReactElement,
} from "react";

export default function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}): ReactElement {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-gray-800">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="p-2 w-full rounded-lg border border-gray-300 transition-colors duration-200 outline-none hover:border-blue-600 focus:border-blue-700"
        type={type}
        placeholder={placeholder}
      />
    </label>
  );
}

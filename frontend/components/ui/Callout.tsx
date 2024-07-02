import { ReactElement, ReactNode } from "react";

type CalloutVariant = "success" | "error" | "warning" | "info";

const variantStyle: Record<CalloutVariant, string> = {
  success: "bg-green-100 border-green-500",
  error: "bg-red-100 border-red-500",
  warning: "bg-yellow-100 border-yellow-500",
  info: "bg-blue-100 border-blue-500",
};

export default function Callout({
  variant = "info",
  title,
  children,
}: {
  children: ReactNode;
  variant?: CalloutVariant;
  title?: string;
}): ReactElement {
  return (
    <div
      className={`p-4 whitespace-pre-wrap border-l-4 ${variantStyle[variant]}`}
    >
      <h2 className="font-bold capitalize">{title}</h2>
      {children}
    </div>
  );
}

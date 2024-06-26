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
  children,
}: {
  variant?: CalloutVariant;
  children: ReactNode;
}): ReactElement {
  return (
    <div className={`border-l-2 font-bold p-4 ${variantStyle[variant]}`}>
      {/* <h2 className="text-lg font-bold capitalize">{variant}</h2> */}
      {children}
    </div>
  );
}

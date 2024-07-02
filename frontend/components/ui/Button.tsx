import Link from "next/link";
import { ReactElement, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  onClick?: () => void;
  href?: string;
};

const baseStyle =
  "flex justify-center p-2 space-x-4 rounded-lg transition-colors duration-200 outline-none";

const variantStyle: Record<ButtonVariant, string> = {
  primary:
    "text-lg font-bold text-white bg-blue-600 border border-blue-600 hover:bg-white hover:text-blue-600",
  secondary: "border border-gray-400 hover:border-blue-600 hover:text-blue-600",
};

export default function Button({
  children,
  variant = "primary",
  onClick,
  href,
}: ButtonProps): ReactElement {
  if ((href == null && !onClick) || (href != null && onClick)) {
    throw new Error(
      'Button component requires exactly one of either "href" or "onClick" prop.',
    );
  }

  if (href != null) {
    return (
      <Link href={href} className={`${baseStyle} ${variantStyle[variant]}`}>
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${variantStyle[variant]}`}
      type="button"
    >
      {children}
    </button>
  );
}

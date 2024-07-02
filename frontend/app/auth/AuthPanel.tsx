import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import { ReactElement, ReactNode } from "react";

export default function AuthPanel({
  children,
  imageSrc,
}: {
  children: ReactNode;
  imageSrc: string | StaticImport;
}): ReactElement {
  return (
    <div className="w-2/3 grid-cols-2 grid-flow-col bg-white rounded-3xl md:grid">
      <main className="p-12">{children}</main>
      <div>
        <Image
          src={imageSrc}
          role="presentation"
          alt=""
          className="hidden object-cover w-full min-h-full max-h-0 rounded-r-3xl md:block"
        />
      </div>
    </div>
  );
}

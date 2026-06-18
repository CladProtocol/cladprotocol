import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function LegionLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

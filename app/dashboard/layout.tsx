import type { ReactNode } from "react";
import DashboardShell from "@/components/axion/DashboardShell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Command Center — Clad Protocol",
  description: "Operator dashboard for Clad Protocol agents and robotics fleets on Base.",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}

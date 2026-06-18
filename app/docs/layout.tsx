import type { ReactNode } from "react";
import PublicHeader from "@/components/axion/PublicHeader";
import Footer from "@/components/axion/Footer";

export const metadata = {
  title: "Documentation — Clad Protocol",
  description:
    "Developer documentation for Clad Protocol: agent manifests, IRONCLAD verification, x402 payments, SDKs, and ROS 2 integration on Base.",
};

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#EFEFEF" }}>
      <PublicHeader active="docs" />
      {children}
      <Footer />
    </main>
  );
}

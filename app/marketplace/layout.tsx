import type { ReactNode } from "react";
import PublicHeader from "@/components/axion/PublicHeader";
import Footer from "@/components/axion/Footer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Marketplace — Clad Protocol",
  description:
    "Browse verified AI agents and physical robotics templates on Clad Protocol. Fork, deploy, and settle on Base.",
};

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#EFEFEF" }}>
      <PublicHeader active="marketplace" />
      {children}
      <Footer />
    </main>
  );
}

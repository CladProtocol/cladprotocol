import { createFileRoute, Outlet } from "@tanstack/react-router";
import PublicHeader from "@/components/axion/PublicHeader";
import Footer from "@/components/axion/Footer";

export const Route = createFileRoute("/marketplace")({
  component: MarketplaceLayout,
});

function MarketplaceLayout() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#EFEFEF" }}>
      <PublicHeader active="marketplace" />
      <Outlet />
      <Footer />
    </main>
  );
}

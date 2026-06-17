import { createFileRoute, Outlet } from "@tanstack/react-router";
import PublicHeader from "@/components/axion/PublicHeader";
import Footer from "@/components/axion/Footer";

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
});

function DocsLayout() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#EFEFEF" }}>
      <PublicHeader active="docs" />
      <Outlet />
      <Footer />
    </main>
  );
}

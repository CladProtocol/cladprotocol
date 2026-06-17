import { createFileRoute } from "@tanstack/react-router";
import Hero from "@/components/axion/Hero";
import About from "@/components/axion/About";
import CaseStudies from "@/components/axion/CaseStudies";
import ValueProps from "@/components/axion/ValueProps";
import HowItWorks from "@/components/axion/HowItWorks";
import CTA from "@/components/axion/CTA";
import Footer from "@/components/axion/Footer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Clad Protocol — AI agents & robotics marketplace on Base" },
      { name: "description", content: "Clad Protocol is the premier marketplace for AI agents and physical robotics on Base. Autonomous execution, ironclad verification." },
    ],
  }),
});

function Index() {
  return (
    <main>
      <Hero />
      <div id="about"><About /></div>
      <div id="marketplace"><CaseStudies /></div>
      <ValueProps />
      <div id="legion"><HowItWorks /></div>
      <div id="command-center"><CTA /></div>
      <Footer />
    </main>
  );
}

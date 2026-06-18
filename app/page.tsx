import Hero from "@/components/axion/Hero";
import About from "@/components/axion/About";
import CaseStudies from "@/components/axion/CaseStudies";
import ValueProps from "@/components/axion/ValueProps";
import HowItWorks from "@/components/axion/HowItWorks";
import CTA from "@/components/axion/CTA";
import Footer from "@/components/axion/Footer";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <div id="about">
        <About />
      </div>
      <div id="marketplace">
        <CaseStudies />
      </div>
      <ValueProps />
      <div id="legion">
        <HowItWorks />
      </div>
      <div id="command-center">
        <CTA />
      </div>
      <Footer />
    </main>
  );
}

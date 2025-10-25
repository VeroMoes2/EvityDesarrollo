import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ResourcesSection from "@/components/ResourcesSection";
import CalculatorSection from "@/components/CalculatorSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ResourcesSection />
        <CalculatorSection />
      </main>
      <Footer />
    </div>
  );
}
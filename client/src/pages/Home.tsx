import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ResourcesSection from "@/components/ResourcesSection";
import CalculatorSection from "@/components/CalculatorSection";
import BlogSection from "@/components/BlogSection";
import NewsletterSection from "@/components/NewsletterSection";
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
        <BlogSection />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
}